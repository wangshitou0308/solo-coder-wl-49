import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll, run, getLastInsertId } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

interface RecordMonitoringBody {
  binId: number;
  temperature: number;
  humidity: number;
  note?: string;
}

interface RecordTurningBody {
  binId: number;
  operator: string;
  note?: string;
}

interface RecordHarvestBody {
  binId: number;
  weight: number;
  note?: string;
}

interface ResolveAlertBody {
  action: string;
  note?: string;
}

router.post('/records', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { binId, temperature, humidity, note } = req.body as RecordMonitoringBody;
    if (!binId || temperature === undefined || humidity === undefined) {
      res.status(400).json({ success: false, error: '仓库ID、温度和湿度不能为空' });
      return;
    }

    const db = await getDb();

    const bin = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [binId]) as any;
    if (!bin) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    run(db,
      'INSERT INTO monitoring_records (bin_id, recorded_by, temperature, humidity, note) VALUES (?, ?, ?, ?, ?)',
      [binId, req.user!.id, temperature, humidity, note || null]
    );

    if (temperature > bin.temp_max) {
      run(db,
        'INSERT INTO alerts (bin_id, type, message, suggestion) VALUES (?, ?, ?, ?)',
        [binId, 'high_temp', `${bin.name}温度${temperature}°C超过上限${bin.temp_max}°C`, '建议加强通风散热，检查是否有异常发酵']
      );
    } else if (temperature < bin.temp_min) {
      run(db,
        'INSERT INTO alerts (bin_id, type, message, suggestion) VALUES (?, ?, ?, ?)',
        [binId, 'low_temp', `${bin.name}温度${temperature}°C低于下限${bin.temp_min}°C`, '建议增加覆盖保温，检查发酵是否停滞']
      );
    }

    if (humidity > bin.humidity_max) {
      run(db,
        'INSERT INTO alerts (bin_id, type, message, suggestion) VALUES (?, ?, ?, ?)',
        [binId, 'high_humidity', `${bin.name}湿度${humidity}%超过上限${bin.humidity_max}%`, '建议增加翻堆频率，改善通风条件']
      );
    } else if (humidity < bin.humidity_min) {
      run(db,
        'INSERT INTO alerts (bin_id, type, message, suggestion) VALUES (?, ?, ?, ?)',
        [binId, 'low_humidity', `${bin.name}湿度${humidity}%低于下限${bin.humidity_min}%`, '建议适量喷水增湿']
      );
    }

    db.save();

    const recordId = getLastInsertId(db);
    const record = queryOne(db, 'SELECT * FROM monitoring_records WHERE id = ?', [recordId]);

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/turning', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { binId, operator, note } = req.body as RecordTurningBody;
    if (!binId || !operator) {
      res.status(400).json({ success: false, error: '仓库ID和操作人不能为空' });
      return;
    }

    const db = await getDb();

    const bin = queryOne(db, 'SELECT id FROM compost_bins WHERE id = ?', [binId]);
    if (!bin) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    run(db,
      'INSERT INTO turning_records (bin_id, operator, note) VALUES (?, ?, ?)',
      [binId, operator, note || null]
    );
    db.save();

    const recordId = getLastInsertId(db);
    const record = queryOne(db, 'SELECT * FROM turning_records WHERE id = ?', [recordId]);

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/harvest', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { binId, weight, note } = req.body as RecordHarvestBody;
    if (!binId || !weight) {
      res.status(400).json({ success: false, error: '仓库ID和重量不能为空' });
      return;
    }

    const db = await getDb();

    const bin = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [binId]) as any;
    if (!bin) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const batchNumber = `BF-${dateStr}-${String(binId).padStart(4, '0')}`;

    run(db,
      'INSERT INTO harvest_records (bin_id, weight, batch_number, note) VALUES (?, ?, ?, ?)',
      [binId, weight, batchNumber, note || null]
    );

    const harvestId = getLastInsertId(db);

    run(db,
      'INSERT INTO fertilizer_batches (batch_number, harvest_id, weight, available_weight) VALUES (?, ?, ?, ?)',
      [batchNumber, harvestId, weight, weight]
    );

    const batchId = getLastInsertId(db);

    run(db,
      'INSERT INTO products (name, type, description, points_price, stock, batch_id) VALUES (?, ?, ?, ?, ?, ?)',
      [`有机肥料${weight}kg`, 'fertilizer', `批次号: ${batchNumber}，社区自制优质有机肥料`, Math.round(weight * 20), weight, batchId]
    );

    db.save();

    const harvest = queryOne(db, 'SELECT * FROM harvest_records WHERE id = ?', [harvestId]);

    res.status(201).json({
      success: true,
      data: {
        harvest,
        batchNumber,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/alerts', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteId, status } = req.query;
    const db = await getDb();

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (siteId) {
      whereClauses.push('cb.site_id = ?');
      params.push(siteId);
    }
    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const alerts = queryAll(db,
      `SELECT a.*, cb.name as bin_name, cb.site_id, cs.name as site_name
       FROM alerts a
       JOIN compost_bins cb ON a.bin_id = cb.id
       JOIN compost_sites cs ON cb.site_id = cs.id
       ${whereStr}
       ORDER BY a.created_at DESC`,
      params
    );

    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/alerts/:id/resolve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, note } = req.body as ResolveAlertBody;
    if (!action) {
      res.status(400).json({ success: false, error: '处理措施不能为空' });
      return;
    }

    const db = await getDb();

    const alert = queryOne(db, 'SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      res.status(404).json({ success: false, error: '告警不存在' });
      return;
    }

    run(db,
      "UPDATE alerts SET status = 'resolved', resolved_by = ?, resolution_note = ?, resolved_at = datetime('now') WHERE id = ?",
      [req.user!.name, `${action}${note ? ' - ' + note : ''}`, req.params.id]
    );
    db.save();

    const updated = queryOne(db, 'SELECT * FROM alerts WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

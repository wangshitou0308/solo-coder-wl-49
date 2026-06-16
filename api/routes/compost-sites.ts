import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll, run, getLastInsertId } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

interface CreateSiteBody {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  bins?: { name: string; temp_min?: number; temp_max?: number; humidity_min?: number; humidity_max?: number }[];
}

interface AddBinBody {
  name: string;
  temp_min?: number;
  temp_max?: number;
  humidity_min?: number;
  humidity_max?: number;
}

interface UpdateBinBody {
  stage?: string;
  temp_min?: number;
  temp_max?: number;
  humidity_min?: number;
  humidity_max?: number;
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const sites: any[] = [];
    const siteResults = queryAll(db, 'SELECT * FROM compost_sites');

    for (const site of siteResults) {
      const bins = queryAll(db, 'SELECT * FROM compost_bins WHERE site_id = ?', [site.id]);
      const activeBins = bins.filter((b: any) => b.stage !== 'harvested');

      const siteWithBins = {
        ...site,
        bins,
        binCount: bins.length,
        status: activeBins.length > 0 ? 'active' : 'inactive',
      };
      sites.push(siteWithBins);
    }

    res.json({ success: true, data: sites });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, latitude, longitude, bins } = req.body as CreateSiteBody;
    if (!name || !address || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, error: '站点名称、地址、经纬度不能为空' });
      return;
    }

    const db = await getDb();
    run(db,
      'INSERT INTO compost_sites (name, address, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, address, latitude, longitude, req.user!.id]
    );

    const siteId = getLastInsertId(db);

    if (bins && bins.length > 0) {
      for (const bin of bins) {
        const qrCode = `QR-SITE${siteId}-${bin.name.replace(/\s+/g, '')}`;
        run(db,
          'INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (?, ?, ?, ?, datetime(\'now\'), ?, ?, ?, ?)',
          [siteId, bin.name, qrCode, 'filling', bin.temp_min ?? 30, bin.temp_max ?? 65, bin.humidity_min ?? 40, bin.humidity_max ?? 70]
        );
        const binId = getLastInsertId(db);
        run(db,
          'INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note) VALUES (?, ?, ?, ?, ?)',
          [binId, 'filling', 'filling', 'system', '初始阶段']
        );
      }
    }

    db.save();

    const site = queryOne(db, 'SELECT * FROM compost_sites WHERE id = ?', [siteId]);

    res.status(201).json({ success: true, data: site });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const site = queryOne(db, 'SELECT * FROM compost_sites WHERE id = ?', [req.params.id]);

    if (!site) {
      res.status(404).json({ success: false, error: '站点不存在' });
      return;
    }

    const bins = queryAll(db, 'SELECT * FROM compost_bins WHERE site_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...site, bins } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, latitude, longitude } = req.body;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM compost_sites WHERE id = ?', [req.params.id]);

    if (!existing) {
      res.status(404).json({ success: false, error: '站点不存在' });
      return;
    }

    const ex = existing as any;
    run(db,
      'UPDATE compost_sites SET name = ?, address = ?, latitude = ?, longitude = ? WHERE id = ?',
      [name ?? ex.name, address ?? ex.address, latitude ?? ex.latitude, longitude ?? ex.longitude, req.params.id]
    );
    db.save();

    const updated = queryOne(db, 'SELECT * FROM compost_sites WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/bins', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, temp_min, temp_max, humidity_min, humidity_max } = req.body as AddBinBody;
    if (!name) {
      res.status(400).json({ success: false, error: '仓库名称不能为空' });
      return;
    }

    const db = await getDb();
    const site = queryOne(db, 'SELECT id FROM compost_sites WHERE id = ?', [req.params.id]);
    if (!site) {
      res.status(404).json({ success: false, error: '站点不存在' });
      return;
    }

    const qrCode = `QR-SITE${req.params.id}-${name.replace(/\s+/g, '')}`;
    run(db,
      'INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (?, ?, ?, ?, datetime(\'now\'), ?, ?, ?, ?)',
      [req.params.id, name, qrCode, 'filling', temp_min ?? 30, temp_max ?? 65, humidity_min ?? 40, humidity_max ?? 70]
    );
    const binId = getLastInsertId(db);
    run(db,
      'INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note) VALUES (?, ?, ?, ?, ?)',
      [binId, 'filling', 'filling', 'system', '初始阶段']
    );
    db.save();

    const bin = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [binId]);
    res.status(201).json({ success: true, data: bin });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:siteId/bins/:binId', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { stage, temp_min, temp_max, humidity_min, humidity_max } = req.body as UpdateBinBody;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ? AND site_id = ?', [req.params.binId, req.params.siteId]);

    if (!existing) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    const ex = existing as any;
    run(db,
      'UPDATE compost_bins SET stage = ?, temp_min = ?, temp_max = ?, humidity_min = ?, humidity_max = ? WHERE id = ?',
      [stage ?? ex.stage, temp_min ?? ex.temp_min, temp_max ?? ex.temp_max, humidity_min ?? ex.humidity_min, humidity_max ?? ex.humidity_max, req.params.binId]
    );
    db.save();

    const updated = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [req.params.binId]);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:siteId/bins/:binId/advance-stage', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const existing = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ? AND site_id = ?', [req.params.binId, req.params.siteId]);

    if (!existing) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    const progression: Record<string, string> = {
      filling: 'fermenting',
      fermenting: 'maturing',
      maturing: 'harvested',
    };

    const bin = existing as any;
    const nextStage = progression[bin.stage];
    if (!nextStage) {
      res.status(400).json({ success: false, error: '仓库已处于最终阶段' });
      return;
    }

    run(db, 'UPDATE compost_bins SET stage = ?, stage_started_at = datetime(\'now\') WHERE id = ?', [nextStage, req.params.binId]);

    run(db,
      'INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note) VALUES (?, ?, ?, ?, ?)',
      [req.params.binId, bin.stage, nextStage, req.user!.name, null]
    );

    db.save();

    const updated = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [req.params.binId]);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

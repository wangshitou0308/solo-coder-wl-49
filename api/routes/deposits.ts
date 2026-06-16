import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll, run, getLastInsertId } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const POINTS_PER_KG: Record<string, number> = {
  kitchen: 10,
  garden: 8,
};

interface CreateDepositBody {
  binId: number;
  residentId: number;
  weight: number;
  wasteType: 'kitchen' | 'garden';
}

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { binId, residentId, weight, wasteType } = req.body as CreateDepositBody;
    if (!binId || !residentId || !weight || !wasteType) {
      res.status(400).json({ success: false, error: '仓库ID、居民ID、重量和垃圾类型不能为空' });
      return;
    }

    if (!POINTS_PER_KG[wasteType]) {
      res.status(400).json({ success: false, error: '无效的垃圾类型，支持 kitchen 或 garden' });
      return;
    }

    const db = await getDb();

    const bin = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [binId]);
    if (!bin) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    const pointsEarned = Math.round(weight * POINTS_PER_KG[wasteType]);

    run(db,
      'INSERT INTO deposits (bin_id, resident_id, weight, waste_type, points_earned) VALUES (?, ?, ?, ?, ?)',
      [binId, residentId, weight, wasteType, pointsEarned]
    );

    run(db, 'UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, residentId]);
    db.save();

    const depositId = getLastInsertId(db);

    const deposit = queryOne(db, 'SELECT * FROM deposits WHERE id = ?', [depositId]);
    const user = queryOne(db, 'SELECT id, phone, name, role, points FROM users WHERE id = ?', [residentId]);

    res.status(201).json({ success: true, data: { deposit, user } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { residentId, siteId, startDate, endDate, page = '1' } = req.query;
    const db = await getDb();

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (residentId) {
      whereClauses.push('d.resident_id = ?');
      params.push(residentId);
    }
    if (siteId) {
      whereClauses.push('cb.site_id = ?');
      params.push(siteId);
    }
    if (startDate) {
      whereClauses.push("d.created_at >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("d.created_at <= ?");
      params.push(endDate);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countResult = queryOne(db,
      `SELECT COUNT(*) as total FROM deposits d JOIN compost_bins cb ON d.bin_id = cb.id ${whereStr}`,
      params
    ) as any;

    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(1, parseInt(page as string));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    const deposits = queryAll(db,
      `SELECT d.*, u.name as resident_name, cb.name as bin_name, cb.site_id, cs.name as site_name
       FROM deposits d
       JOIN users u ON d.resident_id = u.id
       JOIN compost_bins cb ON d.bin_id = cb.id
       JOIN compost_sites cs ON cb.site_id = cs.id
       ${whereStr}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page: pageNum,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

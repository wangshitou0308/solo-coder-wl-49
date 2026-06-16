import { Router, type Request, type Response } from 'express';
import bcryptjs from 'bcryptjs';
import { getDb, queryOne, queryAll, run, getLastInsertId } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.max(1, parseInt(String(pageSize), 10) || 20);
    const offset = (pageNum - 1) * pageSizeNum;

    const db = await getDb();

    let whereClause = '';
    let params: any[] = [];

    if (role) {
      whereClause = 'WHERE role = ?';
      params.push(String(role));
    }

    const totalResult = queryOne(db, `SELECT COUNT(*) as count FROM users ${whereClause}`, params) as any;
    const total = totalResult ? totalResult.count : 0;

    const users = queryAll(
      db,
      `SELECT id, phone, name, role, points, created_at FROM users ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, pageSizeNum, offset]
    );

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, name, password, role } = req.body;

    if (!phone || !name || !password || !role) {
      res.status(400).json({ success: false, error: '手机号、姓名、密码和角色不能为空' });
      return;
    }

    if (!['manager', 'resident'].includes(role)) {
      res.status(400).json({ success: false, error: '角色必须为 manager 或 resident' });
      return;
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing) {
      res.status(409).json({ success: false, error: '该手机号已注册' });
      return;
    }

    const hash = await bcryptjs.hash(password, 10);
    run(db, 'INSERT INTO users (phone, name, password, role) VALUES (?, ?, ?, ?)', [phone, name, hash, role]);
    db.save();

    const id = getLastInsertId(db);
    const user = queryOne(db, 'SELECT id, phone, name, role, points, created_at FROM users WHERE id = ?', [id]);

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/role', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ success: false, error: '角色不能为空' });
      return;
    }

    if (!['admin', 'manager', 'resident'].includes(role)) {
      res.status(400).json({ success: false, error: '角色必须为 admin、manager 或 resident' });
      return;
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    run(db, 'UPDATE users SET role = ? WHERE id = ?', [role, id]);
    db.save();

    const user = queryOne(db, 'SELECT id, phone, name, role, points, created_at FROM users WHERE id = ?', [id]);

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/points-ledger', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    if (req.user!.role !== 'admin' && String(req.user!.id) !== String(id)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.max(1, parseInt(String(pageSize), 10) || 20);
    const offset = (pageNum - 1) * pageSizeNum;

    const db = await getDb();

    const totalResult = queryOne(db, 'SELECT COUNT(*) as count FROM points_ledger WHERE user_id = ?', [id]) as any;
    const total = totalResult ? totalResult.count : 0;

    const list = queryAll(
      db,
      'SELECT * FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [id, pageSizeNum, offset]
    );

    res.json({
      success: true,
      data: {
        list,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

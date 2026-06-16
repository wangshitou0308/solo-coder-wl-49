import { Router, type Request, type Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, queryOne, run } from '../db.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

interface RegisterBody {
  phone: string;
  name: string;
  password: string;
}

interface LoginBody {
  phone: string;
  password: string;
  role?: string;
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, name, password } = req.body as RegisterBody;
    if (!phone || !name || !password) {
      res.status(400).json({ success: false, error: '手机号、姓名和密码不能为空' });
      return;
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing) {
      res.status(409).json({ success: false, error: '该手机号已注册' });
      return;
    }

    const hash = await bcryptjs.hash(password, 10);
    run(db, 'INSERT INTO users (phone, name, password, role) VALUES (?, ?, ?, ?)', [phone, name, hash, 'resident']);
    db.save();

    const user = queryOne(db, 'SELECT id, phone, name, role, points FROM users WHERE phone = ?', [phone]);
    const token = jwt.sign(
      { id: (user as any).id, phone: (user as any).phone, name: (user as any).name, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, data: { token, user } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role } = req.body as LoginBody;
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '手机号和密码不能为空' });
      return;
    }

    const db = await getDb();
    const user = queryOne(db, 'SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      res.status(401).json({ success: false, error: '手机号或密码错误' });
      return;
    }

    if (role && role !== (user as any).role) {
      const roleLabels: Record<string, string> = {
        admin: '管理员',
        manager: '堆肥管理员',
        resident: '居民',
      };
      const expected = roleLabels[(user as any).role] || (user as any).role;
      res.status(401).json({ success: false, error: `该账号角色为${expected}，请选择正确的角色登录` });
      return;
    }

    const valid = await bcryptjs.compare(password, (user as any).password);
    if (!valid) {
      res.status(401).json({ success: false, error: '手机号或密码错误' });
      return;
    }

    const token = jwt.sign(
      { id: (user as any).id, phone: (user as any).phone, name: (user as any).name, role: (user as any).role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPwd } = user as any;
    res.json({ success: true, data: { token, user: userWithoutPwd } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const user = queryOne(db, 'SELECT id, phone, name, role, points, created_at FROM users WHERE id = ?', [req.user!.id]);

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

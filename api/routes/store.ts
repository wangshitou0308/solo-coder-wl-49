import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll, run, getLastInsertId } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

interface ExchangeBody {
  productId: number;
  residentId: number;
  quantity: number;
}

router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const db = await getDb();

    let whereStr = '';
    let params: any[] = [];

    if (type) {
      whereStr = 'WHERE type = ?';
      params.push(type);
    }

    const products = queryAll(db,
      `SELECT * FROM products ${whereStr} ORDER BY created_at DESC`,
      params
    );

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/exchange', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, residentId, quantity } = req.body as ExchangeBody;
    if (!productId || !residentId || !quantity) {
      res.status(400).json({ success: false, error: '商品ID、居民ID和数量不能为空' });
      return;
    }

    const db = await getDb();

    const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [productId]) as any;
    if (!product) {
      res.status(404).json({ success: false, error: '商品不存在' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ success: false, error: '库存不足' });
      return;
    }

    const totalPoints = product.points_price * quantity;

    const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [residentId]) as any;
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    if (user.points < totalPoints) {
      res.status(400).json({ success: false, error: '积分不足' });
      return;
    }

    run(db, 'UPDATE users SET points = points - ? WHERE id = ?', [totalPoints, residentId]);
    run(db, 'UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);

    run(db,
      'INSERT INTO exchange_orders (resident_id, product_id, quantity, total_points, status) VALUES (?, ?, ?, ?, ?)',
      [residentId, productId, quantity, totalPoints, 'completed']
    );

    if (product.batch_id) {
      run(db,
        'UPDATE fertilizer_batches SET available_weight = available_weight - ? WHERE id = ?',
        [quantity, product.batch_id]
      );
    }

    const updatedUserForLedger = queryOne(db, 'SELECT points FROM users WHERE id = ?', [residentId]) as any;
    const balanceAfter = updatedUserForLedger ? updatedUserForLedger.points : 0;

    const orderId = getLastInsertId(db);
    run(db,
      'INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after) VALUES (?, ?, ?, ?, ?, ?)',
      [residentId, 'spend', totalPoints, 'exchange', orderId, balanceAfter]
    );

    db.save();

    const order = queryOne(db, 'SELECT * FROM exchange_orders WHERE id = ?', [orderId]);
    const updatedUser = queryOne(db, 'SELECT id, name, points FROM users WHERE id = ?', [residentId]);

    res.status(201).json({
      success: true,
      data: {
        order,
        user: updatedUser,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/orders', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { residentId } = req.query;
    const db = await getDb();

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (residentId) {
      whereClauses.push('eo.resident_id = ?');
      params.push(residentId);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const orders = queryAll(db,
      `SELECT eo.*, p.name as product_name, u.name as resident_name
       FROM exchange_orders eo
       JOIN products p ON eo.product_id = p.id
       JOIN users u ON eo.resident_id = u.id
       ${whereStr}
       ORDER BY eo.created_at DESC`,
      params
    );

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

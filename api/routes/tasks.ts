import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/daily-checklist', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const pendingMonitoring = queryAll(db,
      `SELECT cb.id, cb.name as bin_name, cs.id as site_id, cs.name as site_name, cb.stage, cb.stage_started_at,
              CAST(julianday('now') - julianday(cb.stage_started_at) AS INTEGER) as days_in_stage
       FROM compost_bins cb
       JOIN compost_sites cs ON cb.site_id = cs.id
       WHERE cb.stage != 'harvested'
         AND cb.id NOT IN (SELECT bin_id FROM monitoring_records WHERE date(created_at) = date('now'))`
    );

    const pendingTurning = queryAll(db,
      `SELECT cb.id, cb.name as bin_name, cs.id as site_id, cs.name as site_name, cb.stage, cb.stage_started_at,
              CAST(julianday('now') - julianday(cb.stage_started_at) AS INTEGER) as days_in_stage
       FROM compost_bins cb
       JOIN compost_sites cs ON cb.site_id = cs.id
       WHERE cb.stage IN ('fermenting', 'maturing')
         AND cb.id NOT IN (SELECT bin_id FROM turning_records WHERE date(created_at) >= date('now', '-3 days'))`
    );

    const pendingAlertsResult = queryOne(db,
      `SELECT COUNT(*) as count FROM alerts WHERE status = 'active'`
    ) as any;

    const pendingAlerts = queryAll(db,
      `SELECT a.*, cb.name as bin_name, cs.id as site_id, cs.name as site_name, cb.stage, cb.stage_started_at,
              CAST(julianday('now') - julianday(cb.stage_started_at) AS INTEGER) as days_in_stage
       FROM alerts a
       JOIN compost_bins cb ON a.bin_id = cb.id
       JOIN compost_sites cs ON cb.site_id = cs.id
       WHERE a.status = 'active'`
    );

    const pendingHarvest = queryAll(db,
      `SELECT cb.id, cb.name as bin_name, cs.id as site_id, cs.name as site_name, cb.stage, cb.stage_started_at,
              CAST(julianday('now') - julianday(cb.stage_started_at) AS INTEGER) as days_in_stage
       FROM compost_bins cb
       JOIN compost_sites cs ON cb.site_id = cs.id
       WHERE cb.stage = 'maturing'
         AND cb.stage_started_at <= datetime('now', '-30 days')`
    );

    res.json({
      success: true,
      data: {
        pendingMonitoring,
        pendingMonitoringCount: pendingMonitoring.length,
        pendingTurning,
        pendingTurningCount: pendingTurning.length,
        pendingAlerts,
        pendingAlertsCount: pendingAlertsResult ? pendingAlertsResult.count : 0,
        pendingHarvest,
        pendingHarvestCount: pendingHarvest.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bins/:binId/detail', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const bin = queryOne(db, 'SELECT * FROM compost_bins WHERE id = ?', [req.params.binId]);
    if (!bin) {
      res.status(404).json({ success: false, error: '仓库不存在' });
      return;
    }

    const site = queryOne(db, 'SELECT * FROM compost_sites WHERE id = ?', [(bin as any).site_id]);

    const recentDeposits = queryAll(db,
      'SELECT * FROM deposits WHERE bin_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.binId]
    );

    const recentMonitoring = queryAll(db,
      'SELECT * FROM monitoring_records WHERE bin_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.binId]
    );

    const recentTurning = queryAll(db,
      'SELECT * FROM turning_records WHERE bin_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.binId]
    );

    const recentHarvest = queryAll(db,
      'SELECT * FROM harvest_records WHERE bin_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.params.binId]
    );

    const recentAlerts = queryAll(db,
      'SELECT * FROM alerts WHERE bin_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.binId]
    );

    const stageRecords = queryAll(db,
      'SELECT * FROM stage_records WHERE bin_id = ? ORDER BY created_at DESC',
      [req.params.binId]
    );

    res.json({
      success: true,
      data: {
        bin,
        site,
        recentDeposits,
        recentMonitoring,
        recentTurning,
        recentHarvest,
        recentAlerts,
        stageRecords,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stage-reminders', authenticate, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const reminders = queryAll(db,
      `SELECT cb.id, cb.name as bin_name, cs.id as site_id, cs.name as site_name, cb.stage, cb.stage_started_at,
              CAST(julianday('now') - julianday(cb.stage_started_at) AS INTEGER) as days_in_stage
       FROM compost_bins cb
       JOIN compost_sites cs ON cb.site_id = cs.id
       WHERE (
         (cb.stage = 'filling' AND cb.stage_started_at <= datetime('now', '-14 days'))
         OR (cb.stage = 'fermenting' AND cb.stage_started_at <= datetime('now', '-10 days'))
         OR (cb.stage = 'maturing' AND cb.stage_started_at <= datetime('now', '-30 days'))
       )`
    );

    res.json({ success: true, data: reminders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

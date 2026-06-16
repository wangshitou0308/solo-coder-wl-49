import { Router, type Request, type Response } from 'express';
import { getDb, queryOne, queryAll } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteId, residentId, startDate, endDate } = req.query;
    const db = await getDb();

    let depositWhere: string[] = [];
    let depositParams: any[] = [];

    if (siteId) {
      depositWhere.push('d.bin_id IN (SELECT id FROM compost_bins WHERE site_id = ?)');
      depositParams.push(siteId);
    }
    if (residentId) {
      depositWhere.push('d.resident_id = ?');
      depositParams.push(residentId);
    }
    if (startDate) {
      depositWhere.push("d.created_at >= ?");
      depositParams.push(startDate);
    }
    if (endDate) {
      depositWhere.push("d.created_at <= ?");
      depositParams.push(endDate);
    }

    const depositWhereStr = depositWhere.length > 0 ? 'WHERE ' + depositWhere.join(' AND ') : '';

    const todayParams = depositParams.filter((_p, i) => {
      const clause = depositWhere[i];
      return clause && !clause.includes("date('now')");
    });
    const todayWhere = depositWhere.length > 0 ? 'AND ' + depositWhere.filter(c => !c.includes("date('now')")).join(' AND ') : '';

    const todayWeightResult = queryOne(db,
      `SELECT COALESCE(SUM(weight), 0) as total FROM deposits d WHERE date(d.created_at) = date('now') ${todayWhere}`,
      todayParams
    ) as any;
    const todayWeight = todayWeightResult ? todayWeightResult.total : 0;

    const totalWeightResult = queryOne(db,
      `SELECT COALESCE(SUM(weight), 0) as total FROM deposits ${depositWhereStr}`,
      depositParams
    ) as any;
    const totalCarbonReduction = totalWeightResult ? totalWeightResult.total * 0.3 : 0;

    let activeSitesSql = `SELECT COUNT(DISTINCT cs.id) as count FROM compost_sites cs
       JOIN compost_bins cb ON cs.id = cb.site_id
       WHERE cb.stage != 'harvested'`;
    let activeSitesParams: any[] = [];
    if (siteId) {
      activeSitesSql += ` AND cs.id = ?`;
      activeSitesParams.push(siteId);
    }
    const activeSitesResult = queryOne(db, activeSitesSql, activeSitesParams) as any;
    const activeSites = activeSitesResult ? activeSitesResult.count : 0;

    const todayDepositorsResult = queryOne(db,
      `SELECT COUNT(DISTINCT resident_id) as count FROM deposits WHERE date(created_at) = date('now')`
    ) as any;
    const todayDepositors = todayDepositorsResult ? todayDepositorsResult.count : 0;

    let siteSql = `SELECT cs.id, cs.name FROM compost_sites cs`;
    let siteParams: any[] = [];
    if (siteId) {
      siteSql += ` WHERE cs.id = ?`;
      siteParams.push(siteId);
    }
    const siteResults = queryAll(db, siteSql, siteParams);

    const siteStatuses: any[] = [];
    for (const site of siteResults) {
      const siteIdVal = (site as any).id;
      const siteName = (site as any).name;

      const binResults = queryAll(db,
        `SELECT id, name, stage FROM compost_bins WHERE site_id = ?`,
        [siteIdVal]
      );

      const bins: any[] = [];
      let hasActive = false;
      for (const bin of binResults) {
        bins.push({ binId: (bin as any).id, name: (bin as any).name, stage: (bin as any).stage });
        if ((bin as any).stage !== 'harvested') hasActive = true;
      }

      siteStatuses.push({
        siteId: siteIdVal,
        siteName,
        status: hasActive ? 'active' : 'inactive',
        bins,
      });
    }

    const trendResults = queryAll(db,
      `SELECT strftime('%Y-%m', created_at) as month, SUM(weight) as weight, COUNT(*) as count
       FROM deposits
       WHERE created_at >= date('now', '-6 months')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month DESC`
    );
    const monthlyTrend = trendResults.map(row => ({
      month: (row as any).month,
      weight: (row as any).weight,
      count: (row as any).count,
    }));

    const topResults = queryAll(db,
      `SELECT id, name, points FROM users WHERE role = 'resident' ORDER BY points DESC LIMIT 10`
    );
    const topResidents = topResults.map(row => ({
      id: (row as any).id,
      name: (row as any).name,
      points: (row as any).points,
    }));

    res.json({
      success: true,
      data: {
        todayWeight,
        totalCarbonReduction,
        activeSites,
        todayDepositors,
        siteStatuses,
        monthlyTrend,
        topResidents,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

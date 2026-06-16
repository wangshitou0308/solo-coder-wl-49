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
      depositParams.push(String(startDate) + ' 00:00:00');
    }
    if (endDate) {
      depositWhere.push("d.created_at <= ?");
      depositParams.push(String(endDate) + ' 23:59:59');
    }

    const depositWhereStr = depositWhere.length > 0 ? 'WHERE ' + depositWhere.join(' AND ') : '';

    let todayWhere: string[] = [];
    let todayParams: any[] = [];
    if (siteId) {
      todayWhere.push('bin_id IN (SELECT id FROM compost_bins WHERE site_id = ?)');
      todayParams.push(siteId);
    }
    if (residentId) {
      todayWhere.push('resident_id = ?');
      todayParams.push(residentId);
    }
    todayWhere.unshift("date(created_at) = date('now')");
    const todayWhereStr = 'WHERE ' + todayWhere.join(' AND ');

    const todayWeightResult = queryOne(db,
      `SELECT COALESCE(SUM(weight), 0) as total FROM deposits ${todayWhereStr}`,
      todayParams
    ) as any;
    const todayWeight = todayWeightResult ? todayWeightResult.total : 0;

    const totalWeightResult = queryOne(db,
      `SELECT COALESCE(SUM(weight), 0) as total FROM deposits d ${depositWhereStr}`,
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
      `SELECT COUNT(DISTINCT resident_id) as count FROM deposits ${todayWhereStr}`,
      todayParams
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
        bins.push({ binId: (bin as any).id, binName: (bin as any).name, name: (bin as any).name, stage: (bin as any).stage });
        if ((bin as any).stage !== 'harvested') hasActive = true;
      }

      siteStatuses.push({
        siteId: siteIdVal,
        siteName,
        status: hasActive ? 'active' : 'inactive',
        bins,
      });
    }

    let trendWhere: string[] = [];
    let trendParams: any[] = [];
    if (siteId) {
      trendWhere.push('bin_id IN (SELECT id FROM compost_bins WHERE site_id = ?)');
      trendParams.push(siteId);
    }
    if (residentId) {
      trendWhere.push('resident_id = ?');
      trendParams.push(residentId);
    }
    if (startDate) {
      trendWhere.push("created_at >= ?");
      trendParams.push(String(startDate) + ' 00:00:00');
    } else {
      trendWhere.push("created_at >= date('now', '-6 months')");
    }
    if (endDate) {
      trendWhere.push("created_at <= ?");
      trendParams.push(String(endDate) + ' 23:59:59');
    }
    const trendWhereStr = trendWhere.length > 0 ? 'WHERE ' + trendWhere.join(' AND ') : '';

    const trendResults = queryAll(db,
      `SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(weight), 0) as weight, COUNT(*) as count
       FROM deposits
       ${trendWhereStr}
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month ASC`
      ,
      trendParams
    );
    const monthlyTrend = trendResults.map(row => ({
      month: (row as any).month,
      weight: (row as any).weight,
      count: (row as any).count,
      carbonReduction: ((row as any).weight || 0) * 0.3,
    }));

    let residentWhere: string[] = [];
    let residentParams: any[] = [];
    if (siteId) {
      residentWhere.push('d.bin_id IN (SELECT id FROM compost_bins WHERE site_id = ?)');
      residentParams.push(siteId);
    }
    if (startDate) {
      residentWhere.push("d.created_at >= ?");
      residentParams.push(String(startDate) + ' 00:00:00');
    }
    if (endDate) {
      residentWhere.push("d.created_at <= ?");
      residentParams.push(String(endDate) + ' 23:59:59');
    }
    const residentWhereStr = residentWhere.length > 0 ? 'AND ' + residentWhere.join(' AND ') : '';

    const topResults = queryAll(db,
      `SELECT u.id as id, u.name as name, u.points as points,
              COALESCE(SUM(d.weight), 0) as totalWeight
       FROM users u
       LEFT JOIN deposits d ON u.id = d.resident_id ${residentWhereStr}
       WHERE u.role = 'resident'
       GROUP BY u.id, u.name, u.points
       ORDER BY totalWeight DESC, u.points DESC
       LIMIT 10`,
      residentParams
    );
    const topResidents = topResults.map((row: any, idx: number) => ({
      residentId: row.id,
      id: row.id,
      name: row.name,
      points: row.points,
      totalWeight: row.totalWeight || 0,
      rank: idx + 1,
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

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcryptjs from 'bcryptjs';

let db: any;

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'resident')),
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS compost_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS compost_bins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES compost_sites(id),
  name TEXT NOT NULL,
  qr_code TEXT,
  stage TEXT NOT NULL CHECK(stage IN ('filling', 'fermenting', 'maturing', 'harvested')) DEFAULT 'filling',
  stage_started_at TEXT,
  temp_min REAL NOT NULL DEFAULT 30,
  temp_max REAL NOT NULL DEFAULT 65,
  humidity_min REAL NOT NULL DEFAULT 40,
  humidity_max REAL NOT NULL DEFAULT 70,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  resident_id INTEGER NOT NULL REFERENCES users(id),
  weight REAL NOT NULL,
  waste_type TEXT NOT NULL CHECK(waste_type IN ('kitchen', 'garden')),
  waste_tag TEXT,
  points_earned INTEGER NOT NULL,
  carbon_reduction REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS monitoring_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS turning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  operator TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS harvest_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  weight REAL NOT NULL,
  batch_number TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS fertilizer_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL UNIQUE,
  harvest_id INTEGER NOT NULL REFERENCES harvest_records(id),
  weight REAL NOT NULL,
  available_weight REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('available', 'depleted')) DEFAULT 'available',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fertilizer', 'plant')),
  description TEXT,
  points_price INTEGER NOT NULL,
  stock REAL NOT NULL,
  batch_id INTEGER REFERENCES fertilizer_batches(id),
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS exchange_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  type TEXT NOT NULL CHECK(type IN ('high_temp', 'low_temp', 'high_humidity', 'low_humidity')),
  message TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'resolved')) DEFAULT 'active',
  resolved_by TEXT,
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS stage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_id INTEGER NOT NULL REFERENCES compost_bins(id),
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  operator TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('earn', 'spend')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_id INTEGER,
  balance_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function seedData(db: any) {
  const adminHash = await bcryptjs.hash('admin123', 10);
  const managerHash = await bcryptjs.hash('manager123', 10);
  const resident1Hash = await bcryptjs.hash('resident123', 10);
  const resident2Hash = await bcryptjs.hash('resident123', 10);

  db.run(`INSERT INTO users (phone, name, password, role, points) VALUES ('13800000001', '张建国', ?, 'admin', 0)`, [adminHash]);
  db.run(`INSERT INTO users (phone, name, password, role, points) VALUES ('13800000002', '李秀英', ?, 'manager', 0)`, [managerHash]);
  db.run(`INSERT INTO users (phone, name, password, role, points) VALUES ('13900000001', '王明华', ?, 'resident', 150)`, [resident1Hash]);
  db.run(`INSERT INTO users (phone, name, password, role, points) VALUES ('13900000002', '陈丽芳', ?, 'resident', 200)`, [resident2Hash]);

  db.run(`INSERT INTO compost_sites (name, address, latitude, longitude, created_by) VALUES ('翠苑社区堆肥站', '浙江省杭州市西湖区翠苑街道文一路120号', 30.2741, 120.1196, 1)`);
  db.run(`INSERT INTO compost_sites (name, address, latitude, longitude, created_by) VALUES ('西溪社区堆肥站', '浙江省杭州市西湖区西溪街道文二路88号', 30.2791, 120.1256, 1)`);

  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (1, 'A1号仓', 'QR-SITE1-A1', 'filling', datetime('now', '-14 days'), 30, 65, 40, 70)`);
  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (1, 'A2号仓', 'QR-SITE1-A2', 'fermenting', datetime('now', '-10 days'), 30, 65, 40, 70)`);
  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (1, 'A3号仓', 'QR-SITE1-A3', 'maturing', datetime('now', '-20 days'), 30, 65, 40, 70)`);
  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (2, 'B1号仓', 'QR-SITE2-B1', 'filling', datetime('now', '-14 days'), 30, 65, 40, 70)`);
  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (2, 'B2号仓', 'QR-SITE2-B2', 'fermenting', datetime('now', '-10 days'), 30, 65, 40, 70)`);
  db.run(`INSERT INTO compost_bins (site_id, name, qr_code, stage, stage_started_at, temp_min, temp_max, humidity_min, humidity_max) VALUES (2, 'B3号仓', 'QR-SITE2-B3', 'filling', datetime('now', '-14 days'), 30, 65, 40, 70)`);

  db.run(`INSERT INTO deposits (bin_id, resident_id, weight, waste_type, waste_tag, points_earned, carbon_reduction, created_at) VALUES (1, 3, 2.5, 'kitchen', 'fruit_peel', 25, 0.75, datetime('now', '-2 days'))`);
  db.run(`INSERT INTO deposits (bin_id, resident_id, weight, waste_type, waste_tag, points_earned, carbon_reduction, created_at) VALUES (1, 4, 1.8, 'garden', 'dead_branches', 14, 0.54, datetime('now', '-1 days'))`);
  db.run(`INSERT INTO deposits (bin_id, resident_id, weight, waste_type, waste_tag, points_earned, carbon_reduction, created_at) VALUES (4, 3, 3.2, 'kitchen', 'coffee_grounds', 32, 0.96, datetime('now', '-1 days'))`);
  db.run(`INSERT INTO deposits (bin_id, resident_id, weight, waste_type, waste_tag, points_earned, carbon_reduction, created_at) VALUES (2, 4, 1.5, 'kitchen', 'vegetable_leaves', 15, 0.45, datetime('now'))`);
  db.run(`INSERT INTO deposits (bin_id, resident_id, weight, waste_type, waste_tag, points_earned, carbon_reduction, created_at) VALUES (6, 3, 2.0, 'garden', 'dead_branches', 16, 0.6, datetime('now'))`);

  db.run(`INSERT INTO monitoring_records (bin_id, recorded_by, temperature, humidity, note, created_at) VALUES (1, 2, 45.0, 55.0, '温度正常', datetime('now', '-1 days'))`);
  db.run(`INSERT INTO monitoring_records (bin_id, recorded_by, temperature, humidity, note, created_at) VALUES (2, 2, 52.0, 60.0, '发酵良好', datetime('now', '-1 days'))`);
  db.run(`INSERT INTO monitoring_records (bin_id, recorded_by, temperature, humidity, note, created_at) VALUES (4, 2, 48.0, 58.0, '湿度略高', datetime('now'))`);

  db.run(`INSERT INTO turning_records (bin_id, operator, note, created_at) VALUES (2, '李秀英', '第一次翻堆', datetime('now', '-3 days'))`);
  db.run(`INSERT INTO turning_records (bin_id, operator, note, created_at) VALUES (5, '李秀英', '定期翻堆', datetime('now', '-1 days'))`);

  db.run(`INSERT INTO harvest_records (bin_id, weight, batch_number, note, created_at) VALUES (3, 50.0, 'BF-20260610-0001', '首批有机肥出仓', datetime('now', '-5 days'))`);

  db.run(`INSERT INTO fertilizer_batches (batch_number, harvest_id, weight, available_weight, status, created_at) VALUES ('BF-20260610-0001', 1, 50.0, 45.0, 'available', datetime('now', '-5 days'))`);

  db.run(`INSERT INTO products (name, type, description, points_price, stock, batch_id, image_url) VALUES ('翠苑有机肥料5kg装', 'fertilizer', '社区自制优质有机肥料，适合家庭花卉和蔬菜种植', 100, 9.0, 1, '')`);
  db.run(`INSERT INTO products (name, type, description, points_price, stock, image_url) VALUES ('绿萝盆栽', 'plant', '净化空气的优质绿植', 80, 20, '')`);
  db.run(`INSERT INTO products (name, type, description, points_price, stock, image_url) VALUES ('薄荷种子包', 'plant', '可食用薄荷种子，易于种植', 50, 50, '')`);

  db.run(`INSERT INTO alerts (bin_id, type, message, suggestion, status, created_at) VALUES (5, 'high_humidity', 'B2号仓湿度超过上限', '建议增加翻堆频率，改善通风条件', 'active', datetime('now', '-1 days'))`);

  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (1, 'filling', 'filling', 'system', '初始阶段', datetime('now', '-14 days'))`);
  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (2, 'filling', 'fermenting', '李秀英', '进入发酵阶段', datetime('now', '-10 days'))`);
  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (3, 'fermenting', 'maturing', '李秀英', '进入腐熟阶段', datetime('now', '-20 days'))`);
  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (4, 'filling', 'filling', 'system', '初始阶段', datetime('now', '-14 days'))`);
  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (5, 'filling', 'fermenting', '李秀英', '进入发酵阶段', datetime('now', '-10 days'))`);
  db.run(`INSERT INTO stage_records (bin_id, from_stage, to_stage, operator, note, created_at) VALUES (6, 'filling', 'filling', 'system', '初始阶段', datetime('now', '-14 days'))`);

  db.run(`INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after, created_at) VALUES (3, 'earn', 25, 'deposit', 1, 25, datetime('now', '-2 days'))`);
  db.run(`INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after, created_at) VALUES (4, 'earn', 14, 'deposit', 2, 14, datetime('now', '-1 days'))`);
  db.run(`INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after, created_at) VALUES (3, 'earn', 32, 'deposit', 3, 57, datetime('now', '-1 days'))`);
  db.run(`INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after, created_at) VALUES (4, 'earn', 15, 'deposit', 4, 29, datetime('now'))`);
  db.run(`INSERT INTO points_ledger (user_id, type, amount, source, reference_id, balance_after, created_at) VALUES (3, 'earn', 16, 'deposit', 5, 73, datetime('now'))`);
}

export function queryOne(db: any, sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = values[i]; });
    return obj;
  }
  stmt.free();
  return null;
}

export function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = values[i]; });
    results.push(obj);
  }
  stmt.free();
  return results;
}

export function run(db: any, sql: string, params: any[] = []): void {
  db.run(sql, params);
}

export function getLastInsertId(db: any): number {
  const result = db.exec('SELECT last_insert_rowid()');
  return result[0].values[0][0] as number;
}

export async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  const dbPath = path.join(process.cwd(), 'data', 'compost.db');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.exec(DDL);
    await seedData(db);
  }

  db.save = () => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, buffer);
  };

  db.save();
  return db;
}

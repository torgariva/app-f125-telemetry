import Database from 'better-sqlite3';
const db = new Database('backend/data/f1_telemetry.db');
const rows = db.prepare('SELECT id, type, total_laps FROM sessions ORDER BY date DESC LIMIT 10').all();
console.log(JSON.stringify(rows, null, 2));

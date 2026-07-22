const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('./paths');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'masjid.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'kajian',
      event_date TEXT NOT NULL,
      event_time TEXT,
      location TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      donor_name TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      method TEXT NOT NULL,
      proof_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS kas_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      saldo INTEGER NOT NULL DEFAULT 0,
      target_bulan INTEGER NOT NULL DEFAULT 50000000,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO kas_settings (id, saldo, target_bulan)
    VALUES (1, 45230000, 50000000);
  `);
}

module.exports = { db, initDb, dataDir, dbPath };

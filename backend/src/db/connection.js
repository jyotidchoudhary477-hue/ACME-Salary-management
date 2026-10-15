import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

export function getDb(dbPath = config.dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export { config as dbConfig };

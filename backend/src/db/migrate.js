import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './connection.js';
import {
  backfillSalaryHistoryFromRevisions,
  repairDuplicateSalaryHistory,
} from '../services/salaryHistoryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function migrate(db = getDb()) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  backfillSalaryHistoryFromRevisions(db);
  repairDuplicateSalaryHistory(db);
  return db;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  migrate();
  console.log('Migration complete.');
}

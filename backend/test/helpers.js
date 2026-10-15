import Database from 'better-sqlite3';
import { migrate } from '../src/db/migrate.js';
export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  return migrate(db);
}

export function sampleEmployee(overrides = {}) {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: `ada.${Date.now()}.${Math.random().toString(16).slice(2)}@acme.test`,
    country: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    hireDate: '2024-01-15',
    status: 'active',
    salary: { annualSalary: 1200000 },
    ...overrides,
  };
}

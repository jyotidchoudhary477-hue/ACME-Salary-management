import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, sampleEmployee } from './helpers.js';
import { backfillSalaryHistoryFromRevisions } from '../src/services/salaryHistoryService.js';
import { createEmployee, getEmployee } from '../src/services/employeeService.js';

describe('backfillSalaryHistoryFromRevisions', () => {
  /** @type {import('better-sqlite3').Database} */
  let db;

  before(() => {
    db = createTestDb();
  });

  it('backfills a single employee when global salary_history is non-empty', () => {
    const a = createEmployee(db, sampleEmployee({ email: 'gap-a@acme.test' }));
    createEmployee(db, sampleEmployee({ email: 'gap-b@acme.test' }));

    db.prepare('DELETE FROM salary_history WHERE employee_id = ?').run(a.id);

    const filled = backfillSalaryHistoryFromRevisions(db);
    assert.ok(filled >= 1);

    const detail = getEmployee(db, a.id);
    assert.equal(detail.salaryHistory.length, detail.revisions.length);
    assert.ok(detail.salaryHistory.length >= 1);
  });
});

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
  updateSalary,
} from '../src/services/employeeService.js';
import { createTestDb, sampleEmployee } from './helpers.js';
import { config } from '../src/config.js';

describe('employeeService CRUD + list', () => {
  /** @type {import('better-sqlite3').Database} */
  let db;

  before(() => {
    db = createTestDb();
  });

  it('creates employee with salary structure and revision', () => {
    const created = createEmployee(db, sampleEmployee({ email: 'create@acme.test' }));
    assert.ok(created.id);
    assert.match(created.employeeCode, new RegExp(`^${config.employeeCodePrefix}\\d+$`));
    assert.ok(created.compensation);
    assert.ok(created.annualSalary > 0);
    assert.equal(created.revisions.length, 1);
    assert.equal(created.salaryHistory.length, 1);
    assert.equal(created.salaryHistory[0].previousAnnualGross, null);
  });

  it('lists with pagination', () => {
    for (let i = 0; i < 5; i++) {
      createEmployee(db, sampleEmployee({ email: `page${i}@acme.test`, department: 'Finance' }));
    }
    const page1 = listEmployees(db, { page: 1, pageSize: 2, department: 'Finance' });
    assert.equal(page1.items.length, 2);
    assert.ok(page1.total >= 5);
    assert.ok(page1.totalPages >= 3);
  });

  it('filters by country and status', () => {
    createEmployee(
      db,
      sampleEmployee({
        email: 'us.active@acme.test',
        country: 'US',
        department: 'Sales',
        status: 'active',
        salary: { annualSalary: 90000 },
      })
    );
    createEmployee(
      db,
      sampleEmployee({
        email: 'us.inactive@acme.test',
        country: 'US',
        department: 'Sales',
        status: 'inactive',
        salary: { annualSalary: 80000 },
      })
    );

    const activeUs = listEmployees(db, { country: 'US', status: 'active', pageSize: 50 });
    assert.ok(activeUs.items.every((e) => e.country === 'US' && e.status === 'active'));
    assert.ok(activeUs.items.some((e) => e.email === 'us.active@acme.test'));
    assert.ok(!activeUs.items.some((e) => e.email === 'us.inactive@acme.test'));
  });

  it('searches by name / code', () => {
    const emp = createEmployee(
      db,
      sampleEmployee({
        firstName: 'UniqueSearch',
        lastName: 'Person',
        email: 'uniquesearch@acme.test',
      })
    );
    const res = listEmployees(db, { q: 'UniqueSearch', pageSize: 10 });
    assert.ok(res.items.some((e) => e.id === emp.id));
  });

  it('updates profile fields', () => {
    const emp = createEmployee(db, sampleEmployee({ email: 'upd@acme.test' }));
    const updated = updateEmployee(db, emp.id, {
      department: 'Product',
      jobTitle: 'PM',
    });
    assert.equal(updated.department, 'Product');
    assert.equal(updated.jobTitle, 'PM');
  });

  it('revises salary and appends history', () => {
    const emp = createEmployee(
      db,
      sampleEmployee({ email: 'raise@acme.test', salary: { annualSalary: 1000000 } })
    );
    const before = emp.annualSalary;
    const revised = updateSalary(
      db,
      emp.id,
      { annualSalary: 1100000, effectiveFrom: '2025-04-01' },
      'Promotion',
      { changedBy: 'HR Test' }
    );
    assert.ok(revised.annualSalary > before);
    assert.ok(revised.revisions.length >= 2);
    assert.ok(revised.revisions.some((r) => r.reason === 'Promotion'));
    assert.equal(revised.salaryHistory.length, 2);
    const latest = revised.salaryHistory[0];
    assert.equal(latest.reason, 'Promotion');
    assert.equal(latest.previousAnnualGross, before);
    assert.ok(latest.newAnnualGross > before);
    assert.equal(latest.changedBy, 'HR Test');
  });

  it('deletes employee and cascades salary rows', () => {
    const emp = createEmployee(db, sampleEmployee({ email: 'del@acme.test' }));
    const result = deleteEmployee(db, emp.id);
    assert.equal(result.ok, true);
    assert.equal(getEmployee(db, emp.id), null);
    const salary = db
      .prepare('SELECT 1 AS ok FROM salary_structures WHERE employee_id = ?')
      .get(emp.id);
    assert.equal(salary, undefined);
  });

  it('rejects unsupported country on create', () => {
    assert.throws(
      () => createEmployee(db, sampleEmployee({ country: 'ZZ', email: 'zz@acme.test' })),
      /Unsupported country/
    );
  });
});

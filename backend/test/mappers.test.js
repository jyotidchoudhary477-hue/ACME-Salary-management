import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  annualToMonthlyEarnings,
  normalizeEarningsInput,
  toEmployeeDto,
  withCompensation,
} from '../src/lib/mappers.js';

describe('toEmployeeDto', () => {
  it('maps snake_case row to API shape', () => {
    const dto = toEmployeeDto({
      id: 7,
      employee_code: 'ACM00007',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@acme.test',
      country: 'IN',
      department: 'Engineering',
      job_title: 'Engineer',
      status: 'active',
      hire_date: '2024-01-15',
      currency: 'INR',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    });
    assert.equal(dto.employeeCode, 'ACM00007');
    assert.equal(dto.firstName, 'Ada');
    assert.equal(dto.jobTitle, 'Engineer');
    assert.equal(dto.hireDate, '2024-01-15');
  });
});

describe('annualToMonthlyEarnings', () => {
  it('splits annual into monthly components that sum near monthly gross', () => {
    const e = annualToMonthlyEarnings(1200000);
    const monthly =
      e.basic + e.hra + e.specialAllowance + e.conveyance + e.medical + e.otherAllowances;
    assert.ok(Math.abs(monthly - 100000) <= 2);
    assert.equal(e.employeePfPercent, 12);
  });
});

describe('normalizeEarningsInput', () => {
  it('prefers annualSalary when present', () => {
    const e = normalizeEarningsInput({ annualSalary: 600000, basic: 1 });
    assert.ok(e.basic > 1);
  });

  it('falls back to component fields', () => {
    const e = normalizeEarningsInput({ basic: 10000, hra: 4000 });
    assert.equal(e.basic, 10000);
    assert.equal(e.hra, 4000);
  });
});

describe('withCompensation', () => {
  it('returns nulls when no salary row', () => {
    const out = withCompensation({ id: 1, country: 'IN' }, null);
    assert.equal(out.compensation, null);
    assert.equal(out.annualSalary, null);
  });

  it('attaches computed annual salary from monthly earnings', () => {
    const out = withCompensation(
      { id: 1, country: 'IN' },
      {
        basic: 50000,
        hra: 20000,
        special_allowance: 15000,
        conveyance: 5000,
        medical: 5000,
        other_allowances: 5000,
        employee_pf_percent: 12,
        retirement_contribution_percent: 5,
        other_deductions: 0,
        effective_from: '2024-01-01',
        updated_at: '2024-01-01',
      }
    );
    assert.equal(out.annualSalary, out.compensation.gross * 12);
    assert.ok(out.compensation.net < out.compensation.gross);
  });
});

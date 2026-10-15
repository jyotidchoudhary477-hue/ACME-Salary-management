import { calculateCompensation, earningsFromRow } from '../domain/salaryCalculator.js';
import { badRequest } from '../lib/errors.js';
import { round2 } from '../domain/countryRules.js';
import { validateRaisePercent } from '../domain/raiseSimulator.js';
import { getCurrentAnnualGross, recordSalaryChange } from './salaryHistoryService.js';

const SALARY_ROW_SELECT = `SELECT e.id, e.country, e.first_name, e.last_name, e.employee_code, e.department,
              s.basic, s.hra, s.special_allowance, s.conveyance, s.medical,
              s.other_allowances, s.employee_pf_percent, s.retirement_contribution_percent,
              s.other_deductions
       FROM employees e
       JOIN salary_structures s ON s.employee_id = e.id`;

export function loadActiveEmployeesInScope(db, { department, country } = {}) {
  const where = [`e.status = 'active'`];
  const params = {};
  if (department) {
    where.push('e.department = @department');
    params.department = department;
  }
  if (country) {
    where.push('e.country = @country');
    params.country = country;
  }

  return db.prepare(`${SALARY_ROW_SELECT} WHERE ${where.join(' AND ')}`).all(params);
}

export function applyPercentRaiseToEmployees(db, rows, { percent, reason }) {
  const validated = validateRaisePercent(percent);
  if (!validated.ok) {
    throw badRequest(validated.error);
  }
  const pct = validated.value;

  if (rows.length === 0) {
    throw badRequest('No active employees match the selected scope');
  }

  const factor = 1 + pct / 100;
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  const revisionReason = reason?.trim() || `Bulk raise ${pct > 0 ? '+' : ''}${pct}%`;
  const scale = (n) => round2(Number(n) * factor);

  const tx = db.transaction(() => {
    let updated = 0;
    for (const row of rows) {
      const previousAnnualGross = getCurrentAnnualGross(db, row.id);
      const earnings = {
        basic: scale(row.basic),
        hra: scale(row.hra),
        specialAllowance: scale(row.special_allowance),
        conveyance: scale(row.conveyance),
        medical: scale(row.medical),
        otherAllowances: scale(row.other_allowances),
        employeePfPercent: row.employee_pf_percent,
        retirementContributionPercent: row.retirement_contribution_percent,
        otherDeductions: row.other_deductions,
      };

      recordSalaryChange(db, {
        employeeId: row.id,
        country: row.country,
        earnings,
        effectiveFrom,
        reason: revisionReason,
        previousAnnualGross,
      });
      updated += 1;
    }
    return updated;
  });

  const updatedCount = tx();

  return {
    updatedCount,
    percent: pct,
    reason: revisionReason,
    effectiveFrom,
    sample: rows.slice(0, 5).map((r) => ({
      id: r.id,
      employeeCode: r.employee_code,
      name: `${r.first_name} ${r.last_name}`,
    })),
  };
}

export function applyBulkRaise(db, { percent, department, country, reason }) {
  if (!department && !country) {
    throw badRequest('Provide department and/or country scope');
  }

  const rows = loadActiveEmployeesInScope(db, { department, country });
  const result = applyPercentRaiseToEmployees(db, rows, { percent, reason });

  return {
    ...result,
    department: department || null,
    country: country || null,
  };
}
export function exportEmployeesCsv(db, filters, { limit = 5000 } = {}) {
  const where = [];
  const params = {};

  if (filters.q?.trim()) {
    where.push(
      `(e.first_name LIKE @q OR e.last_name LIKE @q OR e.email LIKE @q OR e.employee_code LIKE @q OR e.job_title LIKE @q)`
    );
    params.q = `%${filters.q.trim()}%`;
  }
  if (filters.country) {
    where.push('e.country = @country');
    params.country = filters.country;
  }
  if (filters.department) {
    where.push('e.department = @department');
    params.department = filters.department;
  }
  if (filters.jobTitle) {
    where.push('e.job_title = @jobTitle');
    params.jobTitle = filters.jobTitle;
  }
  if (filters.status) {
    where.push('e.status = @status');
    params.status = filters.status;
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT e.*, s.basic, s.hra, s.special_allowance, s.conveyance, s.medical,
              s.other_allowances, s.employee_pf_percent, s.retirement_contribution_percent,
              s.other_deductions
       FROM employees e
       LEFT JOIN salary_structures s ON s.employee_id = e.id
       ${clause}
       ORDER BY e.last_name, e.first_name
       LIMIT @limit`
    )
    .all({ ...params, limit });

  const header = [
    'employee_code',
    'first_name',
    'last_name',
    'email',
    'country',
    'department',
    'job_title',
    'status',
    'hire_date',
    'currency',
    'annual_gross',
    'monthly_net',
    'monthly_ctc',
  ];

  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [header.join(',')];
  for (const row of rows) {
    let annual = '';
    let net = '';
    let ctc = '';
    if (row.basic != null) {
      const comp = calculateCompensation(row.country, earningsFromRow(row));
      annual = String(comp.gross * 12);
      net = String(comp.net);
      ctc = String(comp.ctc);
    }
    lines.push(
      [
        row.employee_code,
        row.first_name,
        row.last_name,
        row.email,
        row.country,
        row.department,
        row.job_title,
        row.status,
        row.hire_date,
        row.currency,
        annual,
        net,
        ctc,
      ]
        .map(escape)
        .join(',')
    );
  }

  return { csv: lines.join('\n'), rowCount: rows.length };
}

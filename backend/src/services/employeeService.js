import { COUNTRY_META } from '../domain/countryRules.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { listSalaryHistory, recordSalaryChange } from './salaryHistoryService.js';
import {
  normalizeEarningsInput,
  toEmployeeDto,
  toListCompensation,
  withCompensation,
} from '../lib/mappers.js';
import { config, formatEmployeeCode } from '../config.js';

const SORTABLE = {
  name: 'e.last_name, e.first_name',
  country: 'e.country, e.last_name',
  department: 'e.department, e.last_name',
  jobTitle: 'e.job_title, e.last_name',
  hireDate: 'e.hire_date',
  salary: 'annual_gross',
  status: 'e.status, e.last_name',
};

const ANNUAL_GROSS_SQL = `(
  COALESCE(s.basic,0) + COALESCE(s.hra,0) + COALESCE(s.special_allowance,0) +
  COALESCE(s.conveyance,0) + COALESCE(s.medical,0) + COALESCE(s.other_allowances,0)
) * 12`;

function buildListFilters({ q, country, department, jobTitle, status, minSalary, maxSalary }) {
  const where = [];
  const params = {};

  if (q?.trim()) {
    where.push(
      `(e.first_name LIKE @q OR e.last_name LIKE @q OR e.email LIKE @q OR e.employee_code LIKE @q OR e.job_title LIKE @q)`
    );
    params.q = `%${q.trim()}%`;
  }
  if (country) {
    where.push('e.country = @country');
    params.country = country;
  }
  if (department) {
    where.push('e.department = @department');
    params.department = department;
  }
  if (jobTitle) {
    where.push('e.job_title = @jobTitle');
    params.jobTitle = jobTitle;
  }
  if (status) {
    where.push('e.status = @status');
    params.status = status;
  }
  if (minSalary != null && minSalary !== '') {
    where.push(`${ANNUAL_GROSS_SQL} >= @minSalary`);
    params.minSalary = Number(minSalary);
  }
  if (maxSalary != null && maxSalary !== '') {
    where.push(`${ANNUAL_GROSS_SQL} <= @maxSalary`);
    params.maxSalary = Number(maxSalary);
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function nextEmployeeCode(db) {
  const last = db
    .prepare(`SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1`)
    .get();
  const next = last?.employee_code
    ? parseInt(String(last.employee_code).replace(/\D/g, ''), 10) + 1
    : 1;
  return formatEmployeeCode(next);
}

function persistSalary(db, employeeId, country, salary, effectiveFrom, reason, options = {}) {
  const earnings = normalizeEarningsInput(salary);
  recordSalaryChange(db, {
    employeeId,
    country,
    earnings,
    effectiveFrom,
    reason,
    changedBy: options.changedBy,
  });
}

export function listEmployees(db, query) {
  const page = Number(query.page) || 1;
  const pageSize = Math.min(
    Number(query.pageSize) || config.defaultPageSize,
    config.maxPageSize
  );
  const sortBy = SORTABLE[query.sortBy] ? query.sortBy : 'name';
  const sortDir = String(query.sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const { clause, params } = buildListFilters(query);

  const total = db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM employees e
       LEFT JOIN salary_structures s ON s.employee_id = e.id
       ${clause}`
    )
    .get(params).c;

  const rows = db
    .prepare(
      `SELECT e.*, s.basic, s.hra, s.special_allowance, s.conveyance, s.medical,
              s.other_allowances, s.employee_pf_percent, s.retirement_contribution_percent,
              s.other_deductions, s.effective_from,
              ${ANNUAL_GROSS_SQL} AS annual_gross
       FROM employees e
       LEFT JOIN salary_structures s ON s.employee_id = e.id
       ${clause}
       ORDER BY ${SORTABLE[sortBy]} ${sortDir}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });

  const items = rows.map((row) => {
    const employee = toEmployeeDto(row);
    const compensation = toListCompensation(row.country, row);
    return {
      ...employee,
      annualSalary: compensation?.annualSalary ?? null,
      compensation,
    };
  });

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
    sortBy,
    sortDir: sortDir.toLowerCase(),
  };
}

export function getEmployee(db, id) {
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!row) return null;

  const salaryRow = db
    .prepare('SELECT * FROM salary_structures WHERE employee_id = ?')
    .get(id);

  const revisions = db
    .prepare(
      `SELECT id, effective_from AS effectiveFrom, reason,
              snapshot_json AS snapshotJson, created_at AS createdAt
       FROM salary_revisions
       WHERE employee_id = ?
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .all(id)
    .map((revision) => ({
      id: revision.id,
      effectiveFrom: revision.effectiveFrom,
      reason: revision.reason,
      createdAt: revision.createdAt,
      snapshot: JSON.parse(revision.snapshotJson),
    }));

  const salaryHistory = listSalaryHistory(db, id);

  return {
    ...withCompensation(toEmployeeDto(row), salaryRow),
    revisions,
    salaryHistory,
  };
}

export function getSalaryHistory(db, employeeId) {
  const row = db.prepare('SELECT id FROM employees WHERE id = ?').get(employeeId);
  if (!row) return null;
  return listSalaryHistory(db, employeeId);
}

export function createEmployee(db, payload, { changedBy } = {}) {
  const meta = COUNTRY_META[payload.country];
  if (!meta) throw badRequest('Unsupported country');

  const code = payload.employeeCode || nextEmployeeCode(db);

  try {
    const employeeId = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO employees (
            employee_code, first_name, last_name, email, country, department,
            job_title, status, hire_date, currency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          code,
          payload.firstName.trim(),
          payload.lastName.trim(),
          payload.email.trim().toLowerCase(),
          payload.country,
          payload.department,
          payload.jobTitle.trim(),
          payload.status || 'active',
          payload.hireDate,
          meta.currency
        );

      persistSalary(
        db,
        result.lastInsertRowid,
        payload.country,
        payload.salary || {},
        payload.salary?.effectiveFrom || payload.hireDate,
        payload.salary?.reason?.trim() || config.initialSalaryReason,
        { changedBy }
      );

      return result.lastInsertRowid;
    })();

    return getEmployee(db, employeeId);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      throw conflict('Email or employee code already exists');
    }
    throw error;
  }
}

export function updateEmployee(db, id, payload) {
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!existing) return null;

  db.prepare(
    `UPDATE employees SET
      first_name = @first_name,
      last_name = @last_name,
      email = @email,
      department = @department,
      job_title = @job_title,
      status = @status,
      updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    first_name: payload.firstName ?? existing.first_name,
    last_name: payload.lastName ?? existing.last_name,
    email: payload.email ?? existing.email,
    department: payload.department ?? existing.department,
    job_title: payload.jobTitle ?? existing.job_title,
    status: payload.status ?? existing.status,
  });

  return getEmployee(db, id);
}

export function deleteEmployee(db, id) {
  const existing = db.prepare('SELECT id, employee_code FROM employees WHERE id = ?').get(id);
  if (!existing) return null;

  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return { ok: true, id: existing.id, employeeCode: existing.employee_code };
}

export function updateSalary(db, id, salary, reason, { changedBy } = {}) {
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!existing) return null;

  const effectiveFrom = salary.effectiveFrom || new Date().toISOString().slice(0, 10);
  const revisionReason = reason?.trim() || salary.reason?.trim() || config.defaultSalaryReason;
  persistSalary(db, id, existing.country, salary, effectiveFrom, revisionReason, { changedBy });
  return getEmployee(db, id);
}

export function listJobTitles(db) {
  return db
    .prepare(`SELECT DISTINCT job_title AS title FROM employees ORDER BY job_title`)
    .all()
    .map((row) => row.title);
}

export function requireEmployee(db, id) {
  const employee = getEmployee(db, id);
  if (!employee) throw notFound('Employee not found');
  return employee;
}

/** Fast typeahead search for global header */
export function searchEmployees(db, q, limit = 8) {
  const query = String(q || '').trim();
  if (!query) return [];

  return db
    .prepare(
      `SELECT id, employee_code AS employeeCode, first_name AS firstName,
              last_name AS lastName, email, department, country, job_title AS jobTitle, status
       FROM employees
       WHERE first_name LIKE @q OR last_name LIKE @q OR email LIKE @q
          OR employee_code LIKE @q OR job_title LIKE @q
       ORDER BY last_name, first_name
       LIMIT @limit`
    )
    .all({ q: `%${query}%`, limit: Math.min(Number(limit) || 8, 20) });
}
export function compareEmployees(db, ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
  if (uniqueIds.length < 2 || uniqueIds.length > 3) {
    throw badRequest('Provide 2 or 3 employee ids to compare');
  }

  const employees = uniqueIds.map((id) => {
    const emp = getEmployee(db, id);
    if (!emp) throw notFound(`Employee ${id} not found`);
    return emp;
  });

  return {
    employees,
    metrics: employees.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      name: `${e.firstName} ${e.lastName}`,
      country: e.country,
      department: e.department,
      jobTitle: e.jobTitle,
      currency: e.currency,
      annualSalary: e.compensation?.annualSalary ?? null,
      monthlyGross: e.compensation?.gross ?? null,
      monthlyNet: e.compensation?.net ?? null,
      monthlyCtc: e.compensation?.ctc ?? null,
      employeeDeductions: e.compensation?.employeeDeductionsTotal ?? null,
      employerCost: e.compensation?.employerContributionsTotal ?? null,
      usdCtc: e.compensation?.usd?.ctc ?? null,
    })),
  };
}

import { COUNTRY_META } from '../domain/countryRules.js';
import { badRequest } from '../lib/errors.js';
import { annualToMonthlyEarnings } from '../lib/mappers.js';
import { formatEmployeeCode, config } from '../config.js';
import { recordSalaryChange } from './salaryHistoryService.js';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\r') {
      /* skip */
    } else {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

function mapHeader(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    map[String(h).trim().toLowerCase()] = i;
  });
  return map;
}

function cell(row, map, key) {
  const idx = map[key];
  if (idx == null) return '';
  return String(row[idx] ?? '').trim();
}
export function importEmployeesCsv(db, csvText, { dryRun = false } = {}) {
  if (!csvText?.trim()) throw badRequest('CSV content is empty');

  const rows = parseCsv(csvText);
  if (rows.length < 2) throw badRequest('CSV must include a header and at least one row');

  const map = mapHeader(rows[0]);
  const required = ['first_name', 'last_name', 'email', 'country', 'department', 'job_title'];
  for (const key of required) {
    if (map[key] == null) {
      throw badRequest(`Missing required column: ${key}`);
    }
  }

  const created = [];
  const skipped = [];
  const errors = [];

  const insertEmp = db.prepare(
    `INSERT INTO employees (
      employee_code, first_name, last_name, email, country, department,
      job_title, status, hire_date, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const emailExists = db.prepare(`SELECT id FROM employees WHERE email = ?`);
  const maxCode = db.prepare(`SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1`);

  let nextNum = 1;
  const last = maxCode.get();
  if (last?.employee_code) {
    nextNum = parseInt(String(last.employee_code).replace(/\D/g, ''), 10) + 1;
  }

  const processRow = (row, lineNo) => {
    const email = cell(row, map, 'email').toLowerCase();
    const country = cell(row, map, 'country').toUpperCase();
    const firstName = cell(row, map, 'first_name');
    const lastName = cell(row, map, 'last_name');
    const department = cell(row, map, 'department');
    const jobTitle = cell(row, map, 'job_title');
    const status = (cell(row, map, 'status') || 'active').toLowerCase();
    const hireDate = cell(row, map, 'hire_date') || new Date().toISOString().slice(0, 10);
    const annualGross = Number(cell(row, map, 'annual_gross'));

    if (!email || !firstName || !lastName) {
      errors.push({ line: lineNo, error: 'Missing name or email' });
      return;
    }
    if (!COUNTRY_META[country]) {
      errors.push({ line: lineNo, error: `Unsupported country: ${country}` });
      return;
    }
    if (emailExists.get(email)) {
      skipped.push({ line: lineNo, email, reason: 'Email already exists' });
      return;
    }

    const code = cell(row, map, 'employee_code') || formatEmployeeCode(nextNum);
    nextNum += 1;

    const annual = Number.isFinite(annualGross) && annualGross > 0 ? annualGross : 600000;
    const earnings = annualToMonthlyEarnings(annual);
    const meta = COUNTRY_META[country];

    if (dryRun) {
      created.push({ line: lineNo, email, employeeCode: code });
      return;
    }

    const info = insertEmp.run(
      code,
      firstName,
      lastName,
      email,
      country,
      department || 'Operations',
      jobTitle || 'Specialist',
      status === 'inactive' ? 'inactive' : 'active',
      hireDate,
      meta.currency
    );

    recordSalaryChange(db, {
      employeeId: info.lastInsertRowid,
      country,
      earnings,
      effectiveFrom: hireDate,
      reason: 'CSV import',
      changedBy: config.noteAuthor,
      previousAnnualGross: null,
    });

    created.push({ line: lineNo, email, employeeCode: code, id: info.lastInsertRowid });
  };

  if (dryRun) {
    rows.slice(1).forEach((row, i) => processRow(row, i + 2));
  } else {
    db.transaction(() => {
      rows.slice(1).forEach((row, i) => processRow(row, i + 2));
    })();
  }

  return {
    dryRun,
    totalRows: rows.length - 1,
    createdCount: created.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    created: created.slice(0, 20),
    skipped: skipped.slice(0, 20),
    errors: errors.slice(0, 20),
  };
}

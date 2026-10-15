import fs from 'fs';
import { getDb } from '../connection.js';
import { migrate } from '../migrate.js';
import { config, formatEmployeeCode } from '../../config.js';
import { COUNTRY_META, DEPARTMENTS } from '../../domain/countryRules.js';
import { calculateCompensation } from '../../domain/salaryCalculator.js';
import { ensureDemoUser } from '../../services/authService.js';
import { FIRST_NAMES, LAST_NAMES, JOB_TITLES } from './data.js';
import {
  basicBand,
  buildEarnings,
  buildSeedEmail,
  mulberry32,
  pick,
  pickCountry,
  randomHireDate,
} from './generators.js';

function resetDatabaseFile(dbPath) {
  if (!fs.existsSync(dbPath)) return;
  fs.unlinkSync(dbPath);
  for (const suffix of ['-wal', '-shm']) {
    try {
      fs.unlinkSync(`${dbPath}${suffix}`);
    } catch {
    }
  }
}
export function seed({
  count = config.seedCount,
  reset = config.seedReset,
  dbPath = config.dbPath,
} = {}) {
  if (reset) resetDatabaseFile(dbPath);

  const db = migrate(getDb(dbPath));
  const rng = mulberry32(config.seedRngSeed);

  const insertEmp = db.prepare(`
    INSERT INTO employees (
      employee_code, first_name, last_name, email, country, department,
      job_title, status, hire_date, currency
    ) VALUES (
      @employee_code, @first_name, @last_name, @email, @country, @department,
      @job_title, @status, @hire_date, @currency
    )
  `);

  const insertSal = db.prepare(`
    INSERT INTO salary_structures (
      employee_id, basic, hra, special_allowance, conveyance, medical,
      other_allowances, employee_pf_percent, retirement_contribution_percent,
      other_deductions, effective_from
    ) VALUES (
      @employee_id, @basic, @hra, @special_allowance, @conveyance, @medical,
      @other_allowances, @employee_pf_percent, @retirement_contribution_percent,
      @other_deductions, @effective_from
    )
  `);

  const updateSal = db.prepare(`
    UPDATE salary_structures SET
      basic = @basic,
      hra = @hra,
      special_allowance = @special_allowance,
      conveyance = @conveyance,
      medical = @medical,
      other_allowances = @other_allowances,
      effective_from = @effective_from,
      updated_at = datetime('now')
    WHERE employee_id = @employee_id
  `);

  const insertRev = db.prepare(`
    INSERT INTO salary_revisions (employee_id, effective_from, reason, snapshot_json)
    VALUES (@employee_id, @effective_from, @reason, @snapshot_json)
  `);

  const insertHist = db.prepare(`
    INSERT INTO salary_history (
      employee_id, previous_annual_gross, new_annual_gross, effective_from, reason
    ) VALUES (
      @employee_id, @previous_annual_gross, @new_annual_gross, @effective_from, @reason
    )
  `);

  const REVISION_REASONS = [
    config.defaultSalaryReason,
    'Promotion',
    'Market adjustment',
    'Performance bonus structure',
  ];

  const started = Date.now();

  db.transaction(() => {
    for (let i = 1; i <= count; i++) {
      const country = pickCountry(rng);
      const meta = COUNTRY_META[country];
      const first = pick(rng, FIRST_NAMES);
      const last = pick(rng, LAST_NAMES);
      const hireDate = randomHireDate(rng, config.seedHireYearStart, config.seedHireYearSpan);
      const status = rng() < config.seedActiveRate ? 'active' : 'inactive';

      const info = insertEmp.run({
        employee_code: formatEmployeeCode(i),
        first_name: first,
        last_name: last,
        email: buildSeedEmail(first, last, i, config.seedEmailDomain),
        country,
        department: pick(rng, DEPARTMENTS),
        job_title: pick(rng, JOB_TITLES),
        status,
        hire_date: hireDate,
        currency: meta.currency,
      });

      const earnings = buildEarnings(country, basicBand(country, rng));
      insertSal.run({
        employee_id: info.lastInsertRowid,
        basic: earnings.basic,
        hra: earnings.hra,
        special_allowance: earnings.specialAllowance,
        conveyance: earnings.conveyance,
        medical: earnings.medical,
        other_allowances: earnings.otherAllowances,
        employee_pf_percent: earnings.employeePfPercent,
        retirement_contribution_percent: earnings.retirementContributionPercent,
        other_deductions: earnings.otherDeductions,
        effective_from: hireDate,
      });

      const initialSnap = calculateCompensation(country, earnings);
      const initialAnnual = Math.round(initialSnap.gross * 12);

      insertRev.run({
        employee_id: info.lastInsertRowid,
        effective_from: hireDate,
        reason: config.initialSalaryReason,
        snapshot_json: JSON.stringify(initialSnap),
      });

      insertHist.run({
        employee_id: info.lastInsertRowid,
        previous_annual_gross: null,
        new_annual_gross: initialAnnual,
        effective_from: hireDate,
        reason: config.initialSalaryReason,
      });

      // ~14% of employees get one follow-up salary change for demo history
      if (i % 7 === 0) {
        const bump = 1.05 + rng() * 0.12;
        const revised = {
          basic: Math.round(earnings.basic * bump),
          hra: Math.round(earnings.hra * bump),
          specialAllowance: Math.round(earnings.specialAllowance * bump),
          conveyance: earnings.conveyance,
          medical: earnings.medical,
          otherAllowances: Math.round(earnings.otherAllowances * bump),
          employeePfPercent: earnings.employeePfPercent,
          retirementContributionPercent: earnings.retirementContributionPercent,
          otherDeductions: earnings.otherDeductions,
        };
        const revDate = `${Math.min(2025, parseInt(hireDate.slice(0, 4), 10) + 1 + Math.floor(rng() * 3))}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-01`;
        const revisedSnap = calculateCompensation(country, revised);
        const newAnnual = Math.round(revisedSnap.gross * 12);

        updateSal.run({
          employee_id: info.lastInsertRowid,
          basic: revised.basic,
          hra: revised.hra,
          special_allowance: revised.specialAllowance,
          conveyance: revised.conveyance,
          medical: revised.medical,
          other_allowances: revised.otherAllowances,
          effective_from: revDate,
        });

        const reason = pick(rng, REVISION_REASONS);
        insertRev.run({
          employee_id: info.lastInsertRowid,
          effective_from: revDate,
          reason,
          snapshot_json: JSON.stringify(revisedSnap),
        });
        insertHist.run({
          employee_id: info.lastInsertRowid,
          previous_annual_gross: initialAnnual,
          new_annual_gross: newAnnual,
          effective_from: revDate,
          reason,
        });
      }
    }
  })();

  ensureDemoUser(db);
  const n = db.prepare('SELECT COUNT(*) AS c FROM employees').get().c;
  db.close();

  return { count: n, elapsedMs: Date.now() - started, dbPath };
}

import { calculateCompensation, computeGross, earningsFromRow } from '../domain/salaryCalculator.js';
import {
  annualGrossFromEarnings,
  annualGrossFromSnapshot,
  buildSalaryHistoryRecord,
  validateSalaryHistoryEntry,
} from '../domain/salaryHistory.js';
import { round2 } from '../domain/countryRules.js';
import { badRequest } from '../lib/errors.js';

function mapHistoryRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    previousAnnualGross: row.previous_annual_gross,
    newAnnualGross: row.new_annual_gross,
    effectiveFrom: row.effective_from,
    reason: row.reason,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  };
}

export function listSalaryHistory(db, employeeId, { limit = 50 } = {}) {
  const rows = db
    .prepare(
      `SELECT id, employee_id, previous_annual_gross, new_annual_gross,
              effective_from, reason, changed_by, created_at
       FROM salary_history
       WHERE employee_id = ?
       ORDER BY effective_from DESC, created_at DESC
       LIMIT ?`
    )
    .all(employeeId, Math.min(Number(limit) || 50, 100));
  return rows.map(mapHistoryRow);
}

export function getCurrentAnnualGross(db, employeeId) {
  const salaryRow = db.prepare('SELECT * FROM salary_structures WHERE employee_id = ?').get(employeeId);
  if (!salaryRow) return null;
  return annualGrossFromEarnings(earningsFromRow(salaryRow));
}

/**
 * Persists salary structure, revision snapshot, and salary history in one step.
 */
export function recordSalaryChange(
  db,
  {
    employeeId,
    country,
    earnings,
    effectiveFrom,
    reason,
    changedBy,
    previousAnnualGross: previousOverride,
  }
) {
  const componentTotal =
    Number(earnings.basic || 0) +
    Number(earnings.hra || 0) +
    Number(earnings.specialAllowance || 0) +
    Number(earnings.conveyance || 0) +
    Number(earnings.medical || 0) +
    Number(earnings.otherAllowances || 0);

  if (componentTotal <= 0) {
    throw badRequest('Salary must be greater than 0');
  }

  const previousAnnualGross =
    previousOverride !== undefined ? previousOverride : getCurrentAnnualGross(db, employeeId);

  const snapshot = calculateCompensation(country, earnings);
  const newAnnualGross = round2(snapshot.gross * 12);

  let validation;
  try {
    validation = validateSalaryHistoryEntry({
      previousAnnualGross,
      newAnnualGross,
      effectiveFrom,
      reason,
    });
  } catch (err) {
    throw badRequest(err.message);
  }

  db.prepare(
    `INSERT INTO salary_structures (
      employee_id, basic, hra, special_allowance, conveyance, medical,
      other_allowances, employee_pf_percent, retirement_contribution_percent,
      other_deductions, effective_from, updated_at
    ) VALUES (
      @employee_id, @basic, @hra, @special_allowance, @conveyance, @medical,
      @other_allowances, @employee_pf_percent, @retirement_contribution_percent,
      @other_deductions, @effective_from, datetime('now')
    )
    ON CONFLICT(employee_id) DO UPDATE SET
      basic = excluded.basic,
      hra = excluded.hra,
      special_allowance = excluded.special_allowance,
      conveyance = excluded.conveyance,
      medical = excluded.medical,
      other_allowances = excluded.other_allowances,
      employee_pf_percent = excluded.employee_pf_percent,
      retirement_contribution_percent = excluded.retirement_contribution_percent,
      other_deductions = excluded.other_deductions,
      effective_from = excluded.effective_from,
      updated_at = datetime('now')`
  ).run({
    employee_id: employeeId,
    basic: earnings.basic,
    hra: earnings.hra,
    special_allowance: earnings.specialAllowance,
    conveyance: earnings.conveyance,
    medical: earnings.medical,
    other_allowances: earnings.otherAllowances,
    employee_pf_percent: earnings.employeePfPercent,
    retirement_contribution_percent: earnings.retirementContributionPercent,
    other_deductions: earnings.otherDeductions,
    effective_from: effectiveFrom,
  });

  if (validation.isInitial || validation.isAnnualChange) {
    db.prepare(
      `INSERT INTO salary_revisions (employee_id, effective_from, reason, snapshot_json)
       VALUES (?, ?, ?, ?)`
    ).run(employeeId, effectiveFrom, reason, JSON.stringify(snapshot));

    const history = buildSalaryHistoryRecord({
      employeeId,
      previousAnnualGross,
      newAnnualGross,
      effectiveFrom,
      reason,
      changedBy,
    });

    db.prepare(
      `INSERT INTO salary_history (
        employee_id, previous_annual_gross, new_annual_gross,
        effective_from, reason, changed_by
      ) VALUES (
        @employeeId, @previousAnnualGross, @newAnnualGross,
        @effectiveFrom, @reason, @changedBy
      )`
    ).run(history);
  }

  return snapshot;
}

const REVISIONS_FOR_HISTORY_SQL = `
  SELECT employee_id, effective_from, reason, snapshot_json, created_at
  FROM salary_revisions
  WHERE (@employeeId IS NULL OR employee_id = @employeeId)
  ORDER BY employee_id ASC, created_at ASC
`;

function insertSalaryHistoryFromRevisions(db, { employeeId = null } = {}) {
  const revisions = db.prepare(REVISIONS_FOR_HISTORY_SQL).all({ employeeId });

  if (revisions.length === 0) return 0;

  const insert = db.prepare(
    `INSERT INTO salary_history (
      employee_id, previous_annual_gross, new_annual_gross,
      effective_from, reason, changed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, NULL, ?)`
  );

  const lastAnnual = new Map();
  let count = 0;

  for (const row of revisions) {
    const snap = JSON.parse(row.snapshot_json);
    const newAnnual = annualGrossFromSnapshot(snap);
    const previous = lastAnnual.has(row.employee_id) ? lastAnnual.get(row.employee_id) : null;
    insert.run(
      row.employee_id,
      previous,
      newAnnual,
      row.effective_from,
      row.reason,
      row.created_at
    );
    lastAnnual.set(row.employee_id, newAnnual);
    count += 1;
  }
  return count;
}

/** Rebuild salary_history for one employee from their revision timeline. */
export function rebuildEmployeeSalaryHistoryFromRevisions(db, employeeId) {
  db.prepare('DELETE FROM salary_history WHERE employee_id = ?').run(employeeId);
  return insertSalaryHistoryFromRevisions(db, { employeeId });
}

function employeesNeedingHistoryBackfill(db) {
  return db
    .prepare(
      `SELECT e.id AS employeeId
       FROM employees e
       WHERE EXISTS (SELECT 1 FROM salary_revisions r WHERE r.employee_id = e.id)
         AND (
           NOT EXISTS (SELECT 1 FROM salary_history h WHERE h.employee_id = e.id)
           OR (SELECT COUNT(*) FROM salary_revisions r WHERE r.employee_id = e.id) >
              (SELECT COUNT(*) FROM salary_history h WHERE h.employee_id = e.id)
         )`
    )
    .all();
}

/** Backfill salary_history from salary_revisions (full or per-employee gaps). */
export function backfillSalaryHistoryFromRevisions(db) {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM salary_history').get().c;
  if (existing === 0) {
    const tx = db.transaction(() => insertSalaryHistoryFromRevisions(db));
    return tx();
  }

  const gaps = employeesNeedingHistoryBackfill(db);
  if (gaps.length === 0) return 0;

  let count = 0;
  const tx = db.transaction(() => {
    for (const { employeeId } of gaps) {
      count += rebuildEmployeeSalaryHistoryFromRevisions(db, employeeId);
    }
  });
  tx();
  return count;
}

/** Replace salary_history rows derived from salary_revisions (fixes duplicate backfills). */
export function rebuildSalaryHistoryFromRevisions(db) {
  db.prepare('DELETE FROM salary_history').run();
  const tx = db.transaction(() => insertSalaryHistoryFromRevisions(db));
  return tx();
}

/** Detect inflated history (e.g. repeated backfills) and rebuild from revisions. */
export function repairDuplicateSalaryHistory(db) {
  const inflated = db
    .prepare(
      `SELECT h.employee_id
       FROM salary_history h
       GROUP BY h.employee_id
       HAVING COUNT(*) > (
         SELECT COUNT(*) FROM salary_revisions r WHERE r.employee_id = h.employee_id
       )
       LIMIT 1`
    )
    .get();
  if (!inflated) return 0;
  return rebuildSalaryHistoryFromRevisions(db);
}

export { annualGrossFromSnapshot, computeGross };

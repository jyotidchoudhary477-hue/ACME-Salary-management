import { round2 } from './countryRules.js';
import { computeGross } from './salaryCalculator.js';

/** Annual gross from monthly earnings components. */
export function annualGrossFromEarnings(earnings) {
  return round2(computeGross(earnings) * 12);
}

/** Annual gross from a compensation snapshot (monthly gross × 12). */
export function annualGrossFromSnapshot(snapshot) {
  if (!snapshot || snapshot.gross == null) return null;
  return round2(Number(snapshot.gross) * 12);
}

/**
 * Validates fields for a salary history row before persisting.
 * @returns {{ isInitial: boolean, isAnnualChange: boolean }}
 */
export function validateSalaryHistoryEntry({
  previousAnnualGross,
  newAnnualGross,
  effectiveFrom,
  reason,
}) {
  if (!Number.isFinite(newAnnualGross) || newAnnualGross <= 0) {
    throw new Error('New salary must be greater than 0');
  }
  if (!effectiveFrom || !String(effectiveFrom).trim()) {
    throw new Error('Effective date is required');
  }

  const prev = previousAnnualGross == null ? null : round2(previousAnnualGross);
  const next = round2(newAnnualGross);
  const isInitial = prev == null;
  const isAnnualChange = !isInitial && prev !== next;

  if (isAnnualChange && (!reason || !String(reason).trim())) {
    throw new Error('Reason is required when salary changes');
  }

  return { isInitial, isAnnualChange };
}

/** Build a normalized history record (pure). */
export function buildSalaryHistoryRecord({
  employeeId,
  previousAnnualGross,
  newAnnualGross,
  effectiveFrom,
  reason,
  changedBy,
}) {
  validateSalaryHistoryEntry({ previousAnnualGross, newAnnualGross, effectiveFrom, reason });
  return {
    employeeId,
    previousAnnualGross: previousAnnualGross == null ? null : round2(previousAnnualGross),
    newAnnualGross: round2(newAnnualGross),
    effectiveFrom: String(effectiveFrom).trim(),
    reason: String(reason || '').trim() || null,
    changedBy: changedBy ? String(changedBy).trim() : null,
  };
}

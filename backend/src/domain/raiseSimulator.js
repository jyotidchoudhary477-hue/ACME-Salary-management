import { round2 } from './countryRules.js';

/**
 * @param {number} percent
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
export function validateRaisePercent(percent) {
  const pct = Number(percent);
  if (!Number.isFinite(pct) || pct === 0 || pct < -50 || pct > 100) {
    return { ok: false, error: 'percent must be between -50 and 100 (non-zero)' };
  }
  return { ok: true, value: pct };
}

/**
 * @param {number} currentAnnual
 * @param {number} percent
 */
export function projectAnnualRaise(currentAnnual, percent) {
  const pct = Number(percent);
  const base = round2(Number(currentAnnual) || 0);
  const factor = 1 + pct / 100;
  const newAnnual = round2(base * factor);
  const raiseAmount = round2(newAnnual - base);
  return {
    currentAnnual: base,
    newAnnual,
    raiseAmount,
    raisePercent: pct,
  };
}

/**
 * @param {Array<{ currency: string, currentAnnual: number, newAnnual: number }>} entries
 */
export function aggregateRaiseTotals(entries) {
  const byCurrency = {};

  for (const e of entries) {
    const currency = e.currency || 'USD';
    if (!byCurrency[currency]) {
      byCurrency[currency] = {
        currency,
        employeeCount: 0,
        currentTotalAnnual: 0,
        newTotalAnnual: 0,
        extraCost: 0,
      };
    }
    byCurrency[currency].employeeCount += 1;
    byCurrency[currency].currentTotalAnnual += e.currentAnnual;
    byCurrency[currency].newTotalAnnual += e.newAnnual;
  }

  const byCurrencyRows = Object.values(byCurrency).map((row) => {
    const currentTotalAnnual = round2(row.currentTotalAnnual);
    const newTotalAnnual = round2(row.newTotalAnnual);
    return {
      currency: row.currency,
      employeeCount: row.employeeCount,
      currentTotalAnnual,
      newTotalAnnual,
      extraCost: round2(newTotalAnnual - currentTotalAnnual),
    };
  });

  byCurrencyRows.sort((a, b) => b.employeeCount - a.employeeCount);

  return {
    employeeCount: entries.length,
    byCurrency: byCurrencyRows,
  };
}

/**
 * @param {Array<{ id: number, name: string, department: string, country: string, currency: string, annualGross: number }>} employeeRows
 * @param {number} percent
 * @param {{ limit?: number }} [options]
 */
export function buildRaisePreviewRows(employeeRows, percent, { limit = 25 } = {}) {
  const rows = employeeRows.map((r) => {
    const projected = projectAnnualRaise(r.annualGross, percent);
    return {
      id: r.id,
      name: r.name,
      department: r.department,
      country: r.country,
      currency: r.currency,
      currentAnnual: projected.currentAnnual,
      newAnnual: projected.newAnnual,
      raiseAmount: projected.raiseAmount,
      raisePercent: projected.raisePercent,
    };
  });

  rows.sort((a, b) => b.currentAnnual - a.currentAnnual);
  return rows.slice(0, limit);
}

import { calculateCompensation, earningsFromRow } from '../domain/salaryCalculator.js';
import {
  aggregateRaiseTotals,
  buildRaisePreviewRows,
  projectAnnualRaise,
  validateRaisePercent,
} from '../domain/raiseSimulator.js';
import { badRequest } from '../lib/errors.js';
import { applyPercentRaiseToEmployees, loadActiveEmployeesInScope } from './payrollService.js';

function mapEmployeesWithAnnual(db, { department, country } = {}) {
  const rows = loadActiveEmployeesInScope(db, { department, country });
  if (rows.length === 0) {
    throw badRequest('No active employees match the selected scope');
  }

  const employees = rows.map((r) => {
    const comp = calculateCompensation(r.country, earningsFromRow(r));
    return {
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      department: r.department,
      country: r.country,
      currency: comp.currency,
      annualGross: comp.gross * 12,
    };
  });

  return { rows, employees };
}

export function simulateRaise(db, { percent, department, country }) {
  const validated = validateRaisePercent(percent);
  if (!validated.ok) {
    throw badRequest(validated.error);
  }

  const { employees } = mapEmployeesWithAnnual(db, { department, country });
  const pct = validated.value;

  const totals = aggregateRaiseTotals(
    employees.map((e) => {
      const projected = projectAnnualRaise(e.annualGross, pct);
      return {
        currency: e.currency,
        currentAnnual: projected.currentAnnual,
        newAnnual: projected.newAnnual,
      };
    })
  );

  const preview = buildRaisePreviewRows(employees, pct, { limit: 25 });

  return {
    percent: pct,
    department: department || null,
    country: country || null,
    previewOnly: true,
    employeeCount: totals.employeeCount,
    totalsByCurrency: totals.byCurrency,
    preview,
    totalInScope: employees.length,
  };
}

export function applySimulatedRaise(db, { percent, department, country }) {
  const validated = validateRaisePercent(percent);
  if (!validated.ok) {
    throw badRequest(validated.error);
  }

  const { rows } = mapEmployeesWithAnnual(db, { department, country });
  const pct = validated.value;
  const reason = `Simulated raise applied: ${pct > 0 ? '+' : ''}${pct}%`;
  const result = applyPercentRaiseToEmployees(db, rows, { percent: pct, reason });

  return {
    ...result,
    department: department || null,
    country: country || null,
  };
}

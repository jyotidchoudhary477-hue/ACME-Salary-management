import {
  calculateCompensation,
  earningsFromRow,
} from '../domain/salaryCalculator.js';
import { round2 } from '../domain/countryRules.js';

export function getSummary(db) {
  const rows = db
    .prepare(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.country, e.department, e.status,
              s.basic, s.hra, s.special_allowance, s.conveyance, s.medical,
              s.other_allowances, s.employee_pf_percent, s.retirement_contribution_percent,
              s.other_deductions
       FROM employees e
       JOIN salary_structures s ON s.employee_id = e.id
       WHERE e.status = 'active'`
    )
    .all();

  let totalGrossUsd = 0;
  let totalNetUsd = 0;
  let totalCtcUsd = 0;
  let totalPfEmployee = 0;
  let totalEmployer = 0;
  let totalEmployeeDeductionsUsd = 0;

  const byCountry = {};
  const byDepartment = {};
  const byCurrency = {};
  const buckets = {
    '0-3k USD CTC': 0,
    '3k-6k USD CTC': 0,
    '6k-10k USD CTC': 0,
    '10k-15k USD CTC': 0,
    '15k+ USD CTC': 0,
  };

  const top = [];

  for (const r of rows) {
    const comp = calculateCompensation(r.country, earningsFromRow(r));
    totalGrossUsd += comp.usd.gross;
    totalNetUsd += comp.usd.net;
    totalCtcUsd += comp.usd.ctc;
    totalEmployeeDeductionsUsd += comp.employeeDeductionsTotal * comp.usd.fxToUsd;
    totalEmployer += comp.employerContributionsTotal * comp.usd.fxToUsd;

    const pf = comp.deductions.find((d) => d.code === 'PF_EE' || d.code === 'CPF_EE' || d.code === '401K');
    if (pf) totalPfEmployee += pf.amount * comp.usd.fxToUsd;

    byCountry[r.country] = byCountry[r.country] || {
      country: r.country,
      headcount: 0,
      ctcUsd: 0,
      netUsd: 0,
    };
    byCountry[r.country].headcount += 1;
    byCountry[r.country].ctcUsd += comp.usd.ctc;
    byCountry[r.country].netUsd += comp.usd.net;

    byDepartment[r.department] = byDepartment[r.department] || {
      department: r.department,
      headcount: 0,
      ctcUsd: 0,
      netUsd: 0,
    };
    byDepartment[r.department].headcount += 1;
    byDepartment[r.department].ctcUsd += comp.usd.ctc;
    byDepartment[r.department].netUsd += comp.usd.net;

    byCurrency[comp.currency] = byCurrency[comp.currency] || {
      currency: comp.currency,
      headcount: 0,
      gross: 0,
      net: 0,
      ctc: 0,
    };
    byCurrency[comp.currency].headcount += 1;
    byCurrency[comp.currency].gross += comp.gross;
    byCurrency[comp.currency].net += comp.net;
    byCurrency[comp.currency].ctc += comp.ctc;

    const c = comp.usd.ctc;
    if (c < 3000) buckets['0-3k USD CTC'] += 1;
    else if (c < 6000) buckets['3k-6k USD CTC'] += 1;
    else if (c < 10000) buckets['6k-10k USD CTC'] += 1;
    else if (c < 15000) buckets['10k-15k USD CTC'] += 1;
    else buckets['15k+ USD CTC'] += 1;

    top.push({
      id: r.id,
      employeeCode: r.employee_code,
      name: `${r.first_name} ${r.last_name}`,
      country: r.country,
      department: r.department,
      ctcUsd: comp.usd.ctc,
      netUsd: comp.usd.net,
      annualGrossUsd: comp.usd.gross * 12,
      currency: comp.currency,
      annualGrossLocal: comp.gross * 12,
    });
  }

  top.sort((a, b) => b.ctcUsd - a.ctcUsd);

  const mapAvg = (obj) =>
    Object.values(obj).map((x) => ({
      ...x,
      ctcUsd: round2(x.ctcUsd),
      netUsd: round2(x.netUsd),
      avgCtcUsd: round2(x.ctcUsd / x.headcount),
      avgNetUsd: round2(x.netUsd / x.headcount),
    }));

  const byCurrencyRows = Object.values(byCurrency)
    .map((x) => ({
      currency: x.currency,
      headcount: x.headcount,
      monthlyGross: round2(x.gross),
      monthlyNet: round2(x.net),
      monthlyCtc: round2(x.ctc),
      annualGross: round2(x.gross * 12),
      annualCtc: round2(x.ctc * 12),
      avgAnnualSalary: round2((x.gross * 12) / x.headcount),
    }))
    .sort((a, b) => b.headcount - a.headcount);

  const recentRevisions = db
    .prepare(
      `SELECT r.id, r.effective_from AS effectiveFrom, r.reason, r.created_at AS createdAt,
              e.id AS employeeId, e.employee_code AS employeeCode,
              e.first_name AS firstName, e.last_name AS lastName, e.department, e.country
       FROM salary_revisions r
       JOIN employees e ON e.id = r.employee_id
       ORDER BY r.created_at DESC
       LIMIT 8`
    )
    .all();

  const n = rows.length || 1;
  return {
    headcountActive: rows.length,
    averageAnnualSalaryUsd: round2((totalGrossUsd * 12) / n),
    averageMonthlyCtcUsd: round2(totalCtcUsd / n),
    monthlyPayrollUsd: {
      gross: round2(totalGrossUsd),
      net: round2(totalNetUsd),
      ctc: round2(totalCtcUsd),
      employeeDeductions: round2(totalEmployeeDeductionsUsd),
      employerContributions: round2(totalEmployer),
      retirementAndPfEmployeeUsd: round2(totalPfEmployee),
    },
    annualPayrollUsd: {
      gross: round2(totalGrossUsd * 12),
      net: round2(totalNetUsd * 12),
      ctc: round2(totalCtcUsd * 12),
    },
    byCountry: mapAvg(byCountry).sort((a, b) => b.headcount - a.headcount),
    byDepartment: mapAvg(byDepartment).sort((a, b) => b.ctcUsd - a.ctcUsd),
    byCurrency: byCurrencyRows,
    salaryDistribution: Object.entries(buckets).map(([bucket, count]) => ({ bucket, count })),
    topEarners: top.slice(0, 15).map((t) => ({
      ...t,
      ctcUsd: round2(t.ctcUsd),
      netUsd: round2(t.netUsd),
      annualGrossUsd: round2(t.annualGrossUsd),
      annualGrossLocal: round2(t.annualGrossLocal),
    })),
    recentRevisions,
    note: 'USD figures use fixed FX rates for cross-country rollup (see countryRules). Annual = monthly × 12.',
  };
}

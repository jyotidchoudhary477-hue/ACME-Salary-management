import {
  calculateCompensation,
  earningsFromRow,
} from '../domain/salaryCalculator.js';
import { EARNINGS_SPLIT, INDIA_RULES, US_RULES } from '../domain/payrollRules.js';
export function toEmployeeDto(row) {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    country: row.country,
    department: row.department,
    jobTitle: row.job_title,
    status: row.status,
    hireDate: row.hire_date,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function withCompensation(employee, salaryRow) {
  if (!salaryRow) {
    return { ...employee, salary: null, compensation: null, annualSalary: null };
  }

  const earnings = earningsFromRow(salaryRow);
  const compensation = calculateCompensation(employee.country, earnings);
  const annualSalary = compensation.gross * 12;

  return {
    ...employee,
    annualSalary,
    salary: {
      ...earnings,
      annualSalary,
      effectiveFrom: salaryRow.effective_from,
      updatedAt: salaryRow.updated_at,
    },
    compensation: {
      ...compensation,
      annualSalary,
      annualCtc: compensation.ctc * 12,
      annualNet: compensation.net * 12,
    },
  };
}
export function toListCompensation(country, salaryRow) {
  if (!salaryRow || salaryRow.basic == null) return null;
  const compensation = calculateCompensation(country, earningsFromRow(salaryRow));
  return {
    gross: compensation.gross,
    net: compensation.net,
    ctc: compensation.ctc,
    annualSalary: compensation.gross * 12,
    annualCtc: compensation.ctc * 12,
    annualNet: compensation.net * 12,
    employeeDeductionsTotal: compensation.employeeDeductionsTotal,
    currency: compensation.currency,
  };
}
export function annualToMonthlyEarnings(annualSalary, extras = {}) {
  const monthly = Number(annualSalary) / 12;
  const basic = Math.round(monthly * EARNINGS_SPLIT.basic);
  const hra = Math.round(monthly * EARNINGS_SPLIT.hra);
  const specialAllowance = Math.round(monthly * EARNINGS_SPLIT.specialAllowance);
  const rest = Math.round(monthly - basic - hra - specialAllowance);

  return {
    basic,
    hra,
    specialAllowance,
    conveyance: Math.round(rest * 0.4),
    medical: Math.round(rest * 0.3),
    otherAllowances: Math.max(0, rest - Math.round(rest * 0.4) - Math.round(rest * 0.3)),
    employeePfPercent: Number(extras.employeePfPercent ?? INDIA_RULES.defaultEmployeePfPercent),
    retirementContributionPercent: Number(
      extras.retirementContributionPercent ?? US_RULES.defaultRetirementPercent
    ),
    otherDeductions: Number(extras.otherDeductions) || 0,
  };
}

export function normalizeEarningsInput(salary = {}) {
  const annual = Number(salary.annualSalary);
  if (Number.isFinite(annual) && annual > 0) {
    return annualToMonthlyEarnings(annual, salary);
  }

  return {
    basic: Number(salary.basic) || 0,
    hra: Number(salary.hra) || 0,
    specialAllowance: Number(salary.specialAllowance) || 0,
    conveyance: Number(salary.conveyance) || 0,
    medical: Number(salary.medical) || 0,
    otherAllowances: Number(salary.otherAllowances) || 0,
    employeePfPercent: Number(salary.employeePfPercent ?? INDIA_RULES.defaultEmployeePfPercent),
    retirementContributionPercent: Number(
      salary.retirementContributionPercent ?? US_RULES.defaultRetirementPercent
    ),
    otherDeductions: Number(salary.otherDeductions) || 0,
  };
}

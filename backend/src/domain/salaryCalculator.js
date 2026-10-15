import {
  COUNTRY_META,
  round2,
  indiaProfessionalTax,
  indiaTdsEstimate,
  usFederalWithholdingEstimate,
} from './countryRules.js';
import { INDIA_RULES, US_RULES } from './payrollRules.js';

/**
 * @typedef {Object} EarningsInput
 * @property {number} basic
 * @property {number} hra
 * @property {number} specialAllowance
 * @property {number} conveyance
 * @property {number} medical
 * @property {number} otherAllowances
 * @property {number} [employeePfPercent] - override PF % where applicable
 * @property {number} [retirementContributionPercent] - US 401k-style
 */
export function computeGross(earnings) {
  const {
    basic = 0,
    hra = 0,
    specialAllowance = 0,
    conveyance = 0,
    medical = 0,
    otherAllowances = 0,
  } = earnings;
  return round2(
    Number(basic) +
      Number(hra) +
      Number(specialAllowance) +
      Number(conveyance) +
      Number(medical) +
      Number(otherAllowances)
  );
}
export function computeDeductions(country, earnings, gross) {
  const basic = Number(earnings.basic) || 0;
  const lines = [];
  let employeeTotal = 0;
  let employerTotal = 0;

  const add = (code, label, amount, borneBy) => {
    const a = round2(amount);
    if (a <= 0) return;
    lines.push({ code, label, amount: a, borneBy });
    if (borneBy === 'employee') employeeTotal = round2(employeeTotal + a);
    else employerTotal = round2(employerTotal + a);
  };

  switch (country) {
    case 'IN': {
      const pfRate =
        Number(earnings.employeePfPercent ?? INDIA_RULES.defaultEmployeePfPercent) / 100;
      const pfBase = Math.min(basic, INDIA_RULES.pfWageCeiling);
      const empPf = pfBase * pfRate;
      const erPf = pfBase * (INDIA_RULES.employerPfPercent / 100);
      add('PF_EE', 'Provident Fund (Employee)', empPf, 'employee');
      add('PF_ER', 'Provident Fund (Employer)', erPf, 'employer');

      if (gross <= INDIA_RULES.esiGrossCeiling) {
        add('ESI_EE', 'ESI (Employee)', gross * INDIA_RULES.esiEmployeeRate, 'employee');
        add('ESI_ER', 'ESI (Employer)', gross * INDIA_RULES.esiEmployerRate, 'employer');
      }

      add('PT', 'Professional Tax', indiaProfessionalTax(gross), 'employee');
      add('TDS', 'Income Tax (TDS est.)', indiaTdsEstimate(gross * 12), 'employee');
      break;
    }
    case 'US': {
      const retirementPct =
        Number(earnings.retirementContributionPercent ?? US_RULES.defaultRetirementPercent) / 100;
      const ssBase = Math.min(gross, US_RULES.socialSecurityWageCapMonthly);
      add('401K', '401(k) Contribution', gross * retirementPct, 'employee');
      add('FICA_SS', 'Social Security (est.)', ssBase * US_RULES.socialSecurityRate, 'employee');
      add('FICA_MED', 'Medicare (est.)', gross * US_RULES.medicareRate, 'employee');
      add('FIT', 'Federal Income Tax (est.)', usFederalWithholdingEstimate(gross), 'employee');
      add(
        'FICA_ER',
        'Employer FICA (est.)',
        ssBase * US_RULES.socialSecurityRate + gross * US_RULES.medicareRate,
        'employer'
      );
      break;
    }
    case 'GB': {
      const ni = Math.max(0, gross - 1048) * 0.08;
      add('NI_EE', 'National Insurance (est.)', ni, 'employee');
      add('PAYE', 'PAYE Income Tax (est.)', Math.max(0, gross - 1257) * 0.2, 'employee');
      add('NI_ER', 'Employer NI (est.)', Math.max(0, gross - 758) * 0.138, 'employer');
      break;
    }
    case 'DE': {
      add('PENSION_EE', 'Pension Insurance (est.)', gross * 0.093, 'employee');
      add('HEALTH_EE', 'Health Insurance (est.)', gross * 0.073, 'employee');
      add('CARE_EE', 'Care Insurance (est.)', gross * 0.015, 'employee');
      add('UNEMP_EE', 'Unemployment (est.)', gross * 0.013, 'employee');
      add('WAGE_TAX', 'Wage Tax (est.)', gross * 0.14, 'employee');
      add('SOCIAL_ER', 'Employer Social (est.)', gross * 0.2, 'employer');
      break;
    }
    case 'SG': {
      const ow = Math.min(basic || gross * 0.6, 6000);
      add('CPF_EE', 'CPF Employee (est.)', ow * 0.2, 'employee');
      add('CPF_ER', 'CPF Employer (est.)', ow * 0.17, 'employer');
      break;
    }
    case 'AE': {
      add('OTHER', 'Other deductions', Number(earnings.otherDeductions) || 0, 'employee');
      break;
    }
    default: {
      add('TAX', 'Income Tax (est.)', gross * 0.15, 'employee');
      add('SOC', 'Social Contribution (est.)', gross * 0.05, 'employer');
    }
  }
  if (country !== 'AE' && earnings.otherDeductions) {
    add('OTHER', 'Other deductions', Number(earnings.otherDeductions), 'employee');
  }

  return {
    lines,
    employeeTotal: round2(employeeTotal),
    employerTotal: round2(employerTotal),
  };
}
export function calculateCompensation(country, earnings) {
  if (!COUNTRY_META[country]) {
    throw new Error(`Unsupported country: ${country}`);
  }
  const meta = COUNTRY_META[country];
  const gross = computeGross(earnings);
  const deductions = computeDeductions(country, earnings, gross);
  const net = round2(gross - deductions.employeeTotal);
  const ctc = round2(gross + deductions.employerTotal);
  const usdGross = round2(gross * meta.fxToUsd);
  const usdNet = round2(net * meta.fxToUsd);
  const usdCtc = round2(ctc * meta.fxToUsd);

  return {
    currency: meta.currency,
    country,
    earnings: {
      basic: round2(earnings.basic || 0),
      hra: round2(earnings.hra || 0),
      specialAllowance: round2(earnings.specialAllowance || 0),
      conveyance: round2(earnings.conveyance || 0),
      medical: round2(earnings.medical || 0),
      otherAllowances: round2(earnings.otherAllowances || 0),
    },
    gross,
    deductions: deductions.lines,
    employeeDeductionsTotal: deductions.employeeTotal,
    employerContributionsTotal: deductions.employerTotal,
    net,
    ctc,
    usd: { gross: usdGross, net: usdNet, ctc: usdCtc, fxToUsd: meta.fxToUsd },
  };
}

export function earningsFromRow(row) {
  return {
    basic: row.basic,
    hra: row.hra,
    specialAllowance: row.special_allowance,
    conveyance: row.conveyance,
    medical: row.medical,
    otherAllowances: row.other_allowances,
    employeePfPercent: row.employee_pf_percent,
    retirementContributionPercent: row.retirement_contribution_percent,
    otherDeductions: row.other_deductions,
  };
}

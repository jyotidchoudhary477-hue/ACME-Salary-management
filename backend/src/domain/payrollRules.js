
export const INDIA_RULES = Object.freeze({
  defaultEmployeePfPercent: 12,
  employerPfPercent: 12,
  pfWageCeiling: 15000,
  esiGrossCeiling: 21000,
  esiEmployeeRate: 0.0075,
  esiEmployerRate: 0.0325,
  professionalTax: [
    { upTo: 15000, amount: 0 },
    { upTo: 20000, amount: 150 },
    { upTo: Infinity, amount: 200 },
  ],
});

export const US_RULES = Object.freeze({
  defaultRetirementPercent: 5,
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  socialSecurityWageCapMonthly: 14000,
});

export const EARNINGS_SPLIT = Object.freeze({
  basic: 0.5,
  hra: 0.2,
  specialAllowance: 0.2,
});

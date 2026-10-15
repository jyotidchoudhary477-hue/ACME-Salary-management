
import { INDIA_RULES } from './payrollRules.js';

export const COUNTRY_META = {
  IN: { name: 'India', currency: 'INR', fxToUsd: 0.012 },
  US: { name: 'United States', currency: 'USD', fxToUsd: 1 },
  GB: { name: 'United Kingdom', currency: 'GBP', fxToUsd: 1.27 },
  DE: { name: 'Germany', currency: 'EUR', fxToUsd: 1.08 },
  SG: { name: 'Singapore', currency: 'SGD', fxToUsd: 0.74 },
  AE: { name: 'United Arab Emirates', currency: 'AED', fxToUsd: 0.27 },
};

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Finance',
  'HR',
  'Operations',
  'Customer Success',
  'Legal',
];
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
export function indiaProfessionalTax(gross) {
  for (const slab of INDIA_RULES.professionalTax) {
    if (gross <= slab.upTo) return slab.amount;
  }
  return INDIA_RULES.professionalTax[INDIA_RULES.professionalTax.length - 1].amount;
}
export function indiaTdsEstimate(annualGross) {
  const slabs = [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.1 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ];
  let remaining = annualGross;
  let prev = 0;
  let tax = 0;
  for (const s of slabs) {
    const width = Math.min(remaining, s.upTo - prev);
    if (width <= 0) break;
    tax += width * s.rate;
    remaining -= width;
    prev = s.upTo;
  }
  return round2(tax / 12);
}

export function usFederalWithholdingEstimate(monthlyGross) {
  const annual = monthlyGross * 12;
  let tax;
  if (annual <= 11000) tax = annual * 0.1;
  else if (annual <= 44725) tax = 1100 + (annual - 11000) * 0.12;
  else if (annual <= 95375) tax = 5147 + (annual - 44725) * 0.22;
  else tax = 16290 + (annual - 95375) * 0.24;
  return round2(tax / 12);
}

import { BASIC_BANDS, COUNTRY_WEIGHTS } from './data.js';
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickCountry(rng) {
  const r = rng();
  let acc = 0;
  for (const [code, weight] of COUNTRY_WEIGHTS) {
    acc += weight;
    if (r <= acc) return code;
  }
  return COUNTRY_WEIGHTS[0][0];
}

export function basicBand(country, rng) {
  const [lo, hi] = BASIC_BANDS[country] || BASIC_BANDS.DEFAULT;
  const t = rng() ** 0.7;
  return Math.round(lo + (hi - lo) * t);
}

export function buildEarnings(country, basic) {
  const hra = country === 'IN' ? Math.round(basic * 0.4) : Math.round(basic * 0.1);
  const specialAllowance = Math.round(basic * 0.25);
  const conveyance = country === 'IN' ? 1600 : Math.round(basic * 0.03);
  const medical = country === 'IN' ? 1250 : Math.round(basic * 0.02);
  const otherAllowances = Math.round(basic * 0.05);
  return {
    basic,
    hra,
    specialAllowance,
    conveyance,
    medical,
    otherAllowances,
    employeePfPercent: 12,
    retirementContributionPercent: 5,
    otherDeductions: 0,
  };
}

export function randomHireDate(rng, yearStart, yearSpan) {
  const year = yearStart + Math.floor(rng() * yearSpan);
  const month = 1 + Math.floor(rng() * 12);
  const day = 1 + Math.floor(rng() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildSeedEmail(first, last, index, domain) {
  return `${first}.${last}.${index}@${domain}`
    .toLowerCase()
    .replace(/\s+/g, '');
}

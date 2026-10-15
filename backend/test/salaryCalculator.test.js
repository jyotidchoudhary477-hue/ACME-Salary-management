import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGross,
  calculateCompensation,
} from '../src/domain/salaryCalculator.js';
import { indiaProfessionalTax, round2 } from '../src/domain/countryRules.js';

describe('computeGross', () => {
  it('sums earnings components', () => {
    assert.equal(
      computeGross({
        basic: 10000,
        hra: 4000,
        specialAllowance: 2000,
        conveyance: 1600,
        medical: 1250,
        otherAllowances: 150,
      }),
      19000
    );
  });

  it('handles zeros', () => {
    assert.equal(computeGross({ basic: 0 }), 0);
  });
});

describe('India compensation', () => {
  const baseEarnings = {
    basic: 20000,
    hra: 8000,
    specialAllowance: 5000,
    conveyance: 1600,
    medical: 1250,
    otherAllowances: 1150,
    employeePfPercent: 12,
  };

  it('applies PF on wage ceiling 15000', () => {
    const c = calculateCompensation('IN', baseEarnings);
    const pf = c.deductions.find((d) => d.code === 'PF_EE');
    assert.equal(pf.amount, 1800); // 12% of 15000
    const erPf = c.deductions.find((d) => d.code === 'PF_ER');
    assert.equal(erPf.amount, 1800);
    assert.equal(erPf.borneBy, 'employer');
  });

  it('applies ESI when gross <= 21000', () => {
    const low = {
      basic: 10000,
      hra: 4000,
      specialAllowance: 2000,
      conveyance: 1600,
      medical: 1250,
      otherAllowances: 150,
    };
    const c = calculateCompensation('IN', low);
    assert.equal(c.gross, 19000);
    assert.ok(c.deductions.some((d) => d.code === 'ESI_EE'));
    assert.ok(c.deductions.some((d) => d.code === 'ESI_ER'));
  });

  it('skips ESI when gross > 21000', () => {
    const c = calculateCompensation('IN', baseEarnings);
    assert.ok(c.gross > 21000);
    assert.equal(
      c.deductions.find((d) => d.code === 'ESI_EE'),
      undefined
    );
  });

  it('net = gross - employee deductions; ctc = gross + employer', () => {
    const c = calculateCompensation('IN', baseEarnings);
    assert.equal(c.net, round2(c.gross - c.employeeDeductionsTotal));
    assert.equal(c.ctc, round2(c.gross + c.employerContributionsTotal));
  });
});

describe('professional tax slabs', () => {
  it('returns expected slab amounts', () => {
    assert.equal(indiaProfessionalTax(10000), 0);
    assert.equal(indiaProfessionalTax(16000), 150);
    assert.equal(indiaProfessionalTax(22000), 200);
    assert.equal(indiaProfessionalTax(50000), 200);
  });
});

describe('US compensation', () => {
  it('includes 401k and FICA', () => {
    const c = calculateCompensation('US', {
      basic: 8000,
      hra: 0,
      specialAllowance: 1000,
      conveyance: 0,
      medical: 200,
      otherAllowances: 0,
      retirementContributionPercent: 6,
    });
    assert.ok(c.deductions.some((d) => d.code === '401K'));
    assert.ok(c.deductions.some((d) => d.code === 'FICA_SS'));
    assert.equal(c.currency, 'USD');
    assert.ok(c.net < c.gross);
    assert.ok(c.ctc > c.gross);
  });
});

describe('unsupported country', () => {
  it('throws', () => {
    assert.throws(() => calculateCompensation('XX', { basic: 1 }), /Unsupported/);
  });
});

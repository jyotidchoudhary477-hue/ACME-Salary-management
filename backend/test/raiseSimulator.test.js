import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateRaiseTotals,
  buildRaisePreviewRows,
  projectAnnualRaise,
  validateRaisePercent,
} from '../src/domain/raiseSimulator.js';

describe('validateRaisePercent', () => {
  it('accepts valid percents', () => {
    assert.deepEqual(validateRaisePercent(5), { ok: true, value: 5 });
    assert.deepEqual(validateRaisePercent(-10), { ok: true, value: -10 });
  });

  it('rejects zero and out-of-range', () => {
    assert.equal(validateRaisePercent(0).ok, false);
    assert.equal(validateRaisePercent(101).ok, false);
    assert.equal(validateRaisePercent(-51).ok, false);
  });
});

describe('projectAnnualRaise', () => {
  it('computes 5% increase', () => {
    const r = projectAnnualRaise(1000000, 5);
    assert.equal(r.currentAnnual, 1000000);
    assert.equal(r.newAnnual, 1050000);
    assert.equal(r.raiseAmount, 50000);
    assert.equal(r.raisePercent, 5);
  });

  it('computes negative change', () => {
    const r = projectAnnualRaise(200000, -10);
    assert.equal(r.newAnnual, 180000);
    assert.equal(r.raiseAmount, -20000);
  });
});

describe('aggregateRaiseTotals', () => {
  it('groups by currency', () => {
    const totals = aggregateRaiseTotals([
      { currency: 'INR', currentAnnual: 100, newAnnual: 110 },
      { currency: 'INR', currentAnnual: 200, newAnnual: 220 },
      { currency: 'USD', currentAnnual: 50000, newAnnual: 52500 },
    ]);
    assert.equal(totals.employeeCount, 3);
    assert.equal(totals.byCurrency.length, 2);
    const inr = totals.byCurrency.find((x) => x.currency === 'INR');
    assert.equal(inr.employeeCount, 2);
    assert.equal(inr.currentTotalAnnual, 300);
    assert.equal(inr.newTotalAnnual, 330);
    assert.equal(inr.extraCost, 30);
  });
});

describe('buildRaisePreviewRows', () => {
  it('sorts by current salary desc and limits rows', () => {
    const preview = buildRaisePreviewRows(
      [
        { id: 1, name: 'A', department: 'Eng', country: 'IN', currency: 'INR', annualGross: 100 },
        { id: 2, name: 'B', department: 'Eng', country: 'IN', currency: 'INR', annualGross: 300 },
        { id: 3, name: 'C', department: 'HR', country: 'US', currency: 'USD', annualGross: 200 },
      ],
      10,
      { limit: 2 }
    );
    assert.equal(preview.length, 2);
    assert.equal(preview[0].id, 2);
    assert.equal(preview[0].newAnnual, 330);
    assert.equal(preview[1].id, 3);
  });
});

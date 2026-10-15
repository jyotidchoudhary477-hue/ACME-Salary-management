import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  annualGrossFromSnapshot,
  buildSalaryHistoryRecord,
  validateSalaryHistoryEntry,
} from '../src/domain/salaryHistory.js';

describe('validateSalaryHistoryEntry', () => {
  it('requires reason when annual salary changes', () => {
    assert.throws(
      () =>
        validateSalaryHistoryEntry({
          previousAnnualGross: 1000000,
          newAnnualGross: 1100000,
          effectiveFrom: '2025-04-01',
          reason: '  ',
        }),
      /Reason is required/
    );
  });

  it('allows initial hire without previous salary', () => {
    const result = validateSalaryHistoryEntry({
      previousAnnualGross: null,
      newAnnualGross: 900000,
      effectiveFrom: '2024-01-15',
      reason: 'Initial structure',
    });
    assert.equal(result.isInitial, true);
    assert.equal(result.isAnnualChange, false);
  });

  it('detects annual change', () => {
    const result = validateSalaryHistoryEntry({
      previousAnnualGross: 900000,
      newAnnualGross: 950000,
      effectiveFrom: '2025-01-01',
      reason: 'Promotion',
    });
    assert.equal(result.isAnnualChange, true);
  });
});

describe('buildSalaryHistoryRecord', () => {
  it('normalizes amounts and trims text fields', () => {
    const row = buildSalaryHistoryRecord({
      employeeId: 42,
      previousAnnualGross: 1000000.004,
      newAnnualGross: 1100000,
      effectiveFrom: ' 2025-06-01 ',
      reason: ' Market adjustment ',
      changedBy: ' Priya ',
    });
    assert.equal(row.employeeId, 42);
    assert.equal(row.previousAnnualGross, 1000000);
    assert.equal(row.newAnnualGross, 1100000);
    assert.equal(row.effectiveFrom, '2025-06-01');
    assert.equal(row.reason, 'Market adjustment');
    assert.equal(row.changedBy, 'Priya');
  });
});

describe('annualGrossFromSnapshot', () => {
  it('derives annual gross from monthly snapshot', () => {
    assert.equal(annualGrossFromSnapshot({ gross: 50000 }), 600000);
  });
});

import { describe, expect, test } from 'vitest';
import { filterLogsForPlan } from '../../../src/hooks/useSmokingIntervals';

describe('useSmokingIntervals/filterLogsForPlan', () => {
  test('無料版では60日前を含み、61日前は除外する', () => {
    const now = new Date('2026-02-25T12:00:00');
    const at60 = new Date('2025-12-27T00:00:00');
    const at61 = new Date('2025-12-26T23:59:59');
    const recent = new Date('2026-02-25T08:00:00');

    const filtered = filterLogsForPlan([at61, at60, recent], now, false);
    expect(filtered).toEqual([at60, recent]);
  });

  test('プレミアム版では60日より前も含めて保持する', () => {
    const now = new Date('2026-02-25T12:00:00');
    const old = new Date('2025-12-01T12:00:00');
    const recent = new Date('2026-02-25T08:00:00');

    const filtered = filterLogsForPlan([old, recent], now, true);
    expect(filtered).toEqual([old, recent]);
  });
});

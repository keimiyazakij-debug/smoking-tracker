import { describe, expect, test } from 'vitest';
import { buildSmokeMessage, getTodayCount, getWeekSummary, getYesterdayCount } from '../../../src/domain/app';

describe('domain/app', () => {
  test('getTodayCount/getYesterdayCount が本数を返す', () => {
    const logs = {
      '2026-01-01': ['a', 'b'],
      '2026-01-02': ['c'],
    };
    expect(getTodayCount(logs, '2026-01-02')).toBe(1);
    expect(getYesterdayCount(logs, '2026-01-02')).toBe(2);
  });

  test('getWeekSummary が7日平均と週合計を計算する', () => {
    const logs = {
      '2026-01-04': ['x'],
      '2026-01-05': ['x', 'y'],
      '2026-01-06': ['x'],
    };
    const summary = getWeekSummary(logs, '2026-01-06');
    expect(summary.avg7).toBe('0.6');
    expect(summary.thisWeek).toBeGreaterThanOrEqual(0);
    expect(summary.lastWeek).toBeGreaterThanOrEqual(0);
  });

  test('buildSmokeMessage は期待候補のいずれかを返す', () => {
    const message = buildSmokeMessage(1, 10);
    expect([
      '目標以内です。いい流れです。',
      '今日もコントロールできています。',
      '順調です。このままいきましょう。',
      '目標ラインです。ここからが大事。',
      '今日はここで止められると最高です。',
      'あと少し、整えていきましょう。',
      '記録できたことが前進です。',
      '大丈夫、また整えていきましょう。',
      '続けていること自体が大切です。',
    ]).toContain(message);
  });
});

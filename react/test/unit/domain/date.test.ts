import { describe, expect, test } from 'vitest';
import {
  formatDurationFromMinutes,
  getConsecutiveNoSmokeDays,
  getDateKey,
  getDayStatus,
  getMonthDateKeys,
  getWeekDateKeys,
  isDateLocked,
  moveBaseDate,
  parseDateKey,
} from '../../../src/domain/date';

describe('domain/date', () => {
  test('getDayStatus: undefined は unrecorded', () => {
    expect(getDayStatus('2026-02-10', {})).toBe('unrecorded');
  });

  test('getDayStatus: 空配列は success', () => {
    expect(getDayStatus('2026-02-10', { '2026-02-10': [] })).toBe('success');
  });

  test('getDayStatus: 配列要素ありは smoke', () => {
    expect(getDayStatus('2026-02-10', { '2026-02-10': ['x'] })).toBe('smoke');
  });

  test('isDateLocked: 無料版は60日超でロックされる', () => {
    const today = new Date();
    const old = new Date(today);
    old.setDate(today.getDate() - 61);
    const boundary = new Date(today);
    boundary.setDate(today.getDate() - 60);

    expect(isDateLocked(old, false)).toBe(true);
    expect(isDateLocked(boundary, false)).toBe(false);
  });

  test('isDateLocked: プレミアムはロックされない', () => {
    const old = new Date();
    old.setDate(old.getDate() - 365);
    expect(isDateLocked(old, true)).toBe(false);
  });

  test('getDateKey/parseDateKey が相互変換できる', () => {
    const key = getDateKey(new Date('2026-02-15T12:34:56'));
    const date = parseDateKey(key);
    expect(getDateKey(date)).toBe('2026-02-15');
  });

  test('formatDurationFromMinutes は分/時間/日を切り替える', () => {
    expect(formatDurationFromMinutes(30)).toBe('30分');
    expect(formatDurationFromMinutes(90)).toBe('1時間30分');
    expect(formatDurationFromMinutes(26 * 60)).toBe('1日2時間');
  });

  test('getConsecutiveNoSmokeDays は連続成功日数を返す', () => {
    const logs = {
      '2026-02-08': ['2026-02-08T10:00:00'],
      '2026-02-09': [],
      '2026-02-10': [],
    };
    expect(getConsecutiveNoSmokeDays(logs, '2026-02-10')).toBe(2);
  });

  test('getMonthDateKeys は対象月の全日を返す', () => {
    const keys = getMonthDateKeys(new Date('2026-02-15T00:00:00'));
    expect(keys[0]).toBe('2026-02-01');
    expect(keys[keys.length - 1]).toBe('2026-02-28');
    expect(keys.length).toBe(28);
  });

  test('getWeekDateKeys は日曜始まりで7日返す', () => {
    const keys = getWeekDateKeys(new Date('2026-02-18T00:00:00'));
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-02-15');
    expect(keys[6]).toBe('2026-02-21');
  });

  test('moveBaseDate は週と月で基準日を移動する', () => {
    expect(getDateKey(moveBaseDate(new Date('2026-02-18T00:00:00'), 'week', -1))).toBe('2026-02-11');
    expect(getDateKey(moveBaseDate(new Date('2026-02-18T00:00:00'), 'month', 1))).toBe('2026-03-18');
  });
});

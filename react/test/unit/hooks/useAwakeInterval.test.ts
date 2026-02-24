import { describe, expect, test } from 'vitest';
import { getAwakeInterval } from '../../../src/hooks/useAwakeInterval';

describe('getAwakeInterval', () => {
  test('sleep未設定時は通常差分を返す', () => {
    const start = new Date('2026-02-24T10:00:00');
    const end = new Date('2026-02-24T12:30:00');
    expect(getAwakeInterval(start, end, null, null)).toBe(150);
  });

  test('同日内の睡眠時間重複を除外する', () => {
    const start = new Date('2026-02-24T20:00:00');
    const end = new Date('2026-02-24T23:00:00');
    expect(getAwakeInterval(start, end, '21:00', '22:00')).toBe(120);
  });

  test('日跨ぎ睡眠（23:30-06:30）を除外する', () => {
    const start = new Date('2026-02-24T22:00:00');
    const end = new Date('2026-02-25T08:00:00');
    expect(getAwakeInterval(start, end, '23:30', '06:30')).toBe(180);
  });

  test('複数日跨ぎでも睡眠帯を毎日除外する', () => {
    const start = new Date('2026-02-24T10:00:00');
    const end = new Date('2026-02-26T10:00:00');
    expect(getAwakeInterval(start, end, '00:00', '06:00')).toBe(2160);
  });
});

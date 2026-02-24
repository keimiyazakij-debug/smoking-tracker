import { describe, expect, test } from 'vitest';
import { buildStatsState } from '../../../src/domain/stats';

describe('domain/stats', () => {
  test('week: hourly は時間帯別本数（合計）', () => {
    const logs = {
      '2024-01-01': ['2024-01-01T10:00:00'],
      '2024-01-03': [],
    };
    const state = buildStatsState('week', 'hourly', new Date('2024-01-03T00:00:00'), logs, true);
    expect(state.chart.title).toBe('時間帯別本数（合計）');
    expect(state.chart.values[10]).toBe(1);
    expect(state.showWeekdayButton).toBe(false);
  });

  test('month: hourly は時間帯別平均本数', () => {
    const logs = {
      '2024-01-01': ['2024-01-01T10:00:00', '2024-01-01T10:30:00'],
      '2024-01-02': [],
    };
    const state = buildStatsState('month', 'hourly', new Date('2024-01-15T00:00:00'), logs, true);
    expect(state.chart.title).toBe('時間帯別本数（平均）');
    expect(state.chart.values[10]).toBe(1);
  });

  test('all: 13か月以上はスクロール有効', () => {
    const logs: Record<string, string[]> = {};
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(2026, 0, 1);
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      logs[`${month}-01`] = [`${month}-01T10:00:00`];
    }
    const state = buildStatsState('all', 'primary', new Date('2026-01-15T00:00:00'), logs, true);
    expect(state.chart.title).toBe('月別本数');
    expect(state.chart.scrollable).toBe(true);
  });

  test('week/month label は固定フォーマットでundefinedにならない', () => {
    const logs = { '2026-02-01': ['2026-02-01T10:00:00'] };
    const week = buildStatsState('week', 'primary', new Date('2026-02-24T00:00:00'), logs, true);
    const month = buildStatsState('month', 'primary', new Date('2026-02-24T00:00:00'), logs, true);
    expect(week.label).toBe('2026/02/22週');
    expect(month.label).toBe('2026/02');
    expect(week.label).not.toContain('undefined');
    expect(month.label).not.toContain('undefined');
  });
});

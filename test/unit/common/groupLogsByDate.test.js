/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('groupLogsByDate', () => {

  test('ログが空の場合は空配列を返す', () => {
    const result = window.common.groupLogsByDate({});
    expect(result).toEqual([]);
  });

  test('dailyLogs に存在するキーのみ日付配列を生成する', () => {
    const logs = {
      '2026-01-01': ['a'],
      '2026-01-03': ['b']
    };

    const days = window.common.groupLogsByDate(logs);

    expect(days[0].date).toBe('2026-01-01');
    expect(days[days.length - 1].date).toBe('2026-01-03');
  });

  test('キー存在かつ空配列は success として logged=true になる', () => {
    const logs = {
      '2026-01-01': ['a'],
      '2026-01-02': [],
      '2026-01-03': ['b']
    };

    const days = window.common.groupLogsByDate(logs);

    const day2 = days.find(d => d.date === '2026-01-02');

    expect(day2).toEqual({
      date: '2026-01-02',
      smoke: 0,
      logged: true
    });
  });

  test('記録日は本数が正しく集計される', () => {
    const logs = {
      '2026-01-01': ['a','b','c'],
      '2026-01-02': ['a']
    };

    const days = window.common.groupLogsByDate(logs);

    expect(days[0]).toEqual({
      date: '2026-01-01',
      smoke: 3,
      logged: true
    });

    expect(days[1]).toEqual({
      date: '2026-01-02',
      smoke: 1,
      logged: true
    });
  });

  test('日付は昇順で並ぶ', () => {
    const logs = {
      '2026-01-03': ['a'],
      '2026-01-01': ['a'],
      '2026-01-02': ['a']
    };

    const days = window.common.groupLogsByDate(logs);

    const dates = days.map(d => d.date);
    const sorted = [...dates].sort();

    expect(dates).toEqual(sorted);
  });

});

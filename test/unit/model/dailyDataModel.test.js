/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeEach(() => {
  localStorage.clear();
  window.logModel = {
    getLogs: () => ({
      '2026-02-10': ['2026-02-10T10:00:00.000Z'],
      '2026-02-12': ['2026-02-12T08:00:00.000Z', '2026-02-12T09:00:00.000Z'],
    }),
  };
  window.common = {
    loadLogs: () => ({
      '2026-02-10': ['2026-02-10T10:00:00.000Z'],
      '2026-02-12': ['2026-02-12T08:00:00.000Z', '2026-02-12T09:00:00.000Z'],
    }),
  };

  loadBrowserScript('../app/model/dailyDataModel.js', {
    common: window.common,
    logModel: window.logModel,
  });
});

describe('dailyDataModel', () => {
  test('syncCountsFromLogs: memo専用構造では既存memosを返す', () => {
    localStorage.setItem('memos', JSON.stringify({
      '2026-02-10': '振り返り',
    }));

    const synced = window.dailyDataModel.syncCountsFromLogs(window.logModel.getLogs());
    expect(synced).toEqual({ '2026-02-10': '振り返り' });
  });

  test('upsertMemo: 空メモ時はキーを削除する', () => {
    localStorage.setItem('memos', JSON.stringify({ '2026-02-12': 'メモ' }));
    window.dailyDataModel.upsertMemo('2026-02-12', '   ');
    const stored = window.dailyDataModel.loadDailyData();
    expect(stored['2026-02-12']).toBeUndefined();
  });

  test('upsertMemo: メモを文字列で保存する', () => {
    window.dailyDataModel.upsertMemo('2026-02-12', '疲れた日だった');
    const stored = window.dailyDataModel.loadDailyData();
    expect(stored['2026-02-12']).toBe('疲れた日だった');
  });

  test('loadDailyData: legacy dailyData から memo を移行する', () => {
    localStorage.setItem('dailyData', JSON.stringify({
      '2026-02-12': { count: 0, memo: '旧メモ' },
      '2026-02-13': { count: 2 },
    }));
    const stored = window.dailyDataModel.loadDailyData();
    expect(stored).toEqual({ '2026-02-12': '旧メモ' });
    expect(JSON.parse(localStorage.getItem('memos'))).toEqual({ '2026-02-12': '旧メモ' });
  });
});

/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

describe('logModel.removeLastSmoke', () => {
  beforeAll(() => {
    loadBrowserScript('../app/common/common.js');
    loadBrowserScript('../app/model/logModel.js');
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('最新1件を削除する', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-02-01': [
        '2026-02-01T09:00:00+09:00',
        '2026-02-01T10:00:00+09:00'
      ]
    }));

    const removed = window.logModel.removeLastSmoke('2026-02-01');
    expect(removed).toBe(true);

    const logs = window.logModel.getLogs();
    expect(logs['2026-02-01']).toEqual([
      '2026-02-01T09:00:00+09:00'
    ]);
  });

  test('最後の1件を削除したら日付キーを消す', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-02-01': ['2026-02-01T09:00:00+09:00']
    }));

    const removed = window.logModel.removeLastSmoke('2026-02-01');
    expect(removed).toBe(true);

    const logs = window.logModel.getLogs();
    expect(logs['2026-02-01']).toBeUndefined();
  });

  test('ログが無い場合は false を返す', () => {
    const removed = window.logModel.removeLastSmoke('2026-02-01');
    expect(removed).toBe(false);
  });
});

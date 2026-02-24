/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  window.logModel = {
    getLogs: () => JSON.parse(localStorage.getItem('dailyLogs') || '{}'),
    setLogs: (logs) => localStorage.setItem('dailyLogs', JSON.stringify(logs || {})),
  };
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/editModel.js', {
    logModel: window.logModel,
  });
});

describe('editModel.open', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('既存ログを HH:MM に変換して読み込む', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-02': [
        '2026-01-02T09:30:00+09:00',
        '2026-01-02T18:05:00+09:00'
      ]
    }));

    editModel.open('2026-01-02');
    const state = editModel.getState();

    expect(state.dateKey).toBe('2026-01-02');
    expect(state.times).toEqual(['09:30', '18:05']);
  });

  test('ログがない日は空配列', () => {
    editModel.open('2026-01-03');
    expect(editModel.getState().times).toEqual([]);
  });

});

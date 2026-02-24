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

describe('editModel.close', () => {

  test('state が初期化される', () => {
    editModel.open('2026-01-02');
    editModel.addTime('10:00');
    editModel.close();

    const state = editModel.getState();
    expect(state.dateKey).toBeNull();
    expect(state.times).toEqual([]);
  });

});

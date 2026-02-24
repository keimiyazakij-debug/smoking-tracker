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

describe('editModel time mutations', () => {

  beforeEach(() => {
    editModel.open('2026-01-02');
  });

  test('addTime で追加される', () => {
    editModel.addTime('10:00');
    expect(editModel.getState().times).toEqual(['10:00']);
  });

  test('updateTime で上書きされる', () => {
    editModel.addTime('10:00');
    editModel.updateTime(0, '11:00');
    expect(editModel.getState().times[0]).toBe('11:00');
  });

  test('removeTime で削除される', () => {
    editModel.addTime('10:00');
    editModel.removeTime(0);
    expect(editModel.getState().times).toEqual([]);
  });

});

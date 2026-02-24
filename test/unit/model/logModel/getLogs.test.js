/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/model/logModel.js');
});

describe('logModel.getLogs', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('未保存時は空オブジェクト', () => {
    expect(logModel.getLogs()).toEqual({});
  });

  test('保存済みログを返す', () => {
    const data = { '2026-01-01': ['a'] };
    localStorage.setItem('dailyLogs', JSON.stringify(data));

    expect(logModel.getLogs()).toEqual(data);
  });

});

/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/logModel.js');
});

describe('logModel.getConsecutiveLogDays', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('連続記録日数の最大値を返す', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': ['a'],
      '2026-01-02': ['a'],
      '2026-01-04': ['a'],
      '2026-01-05': ['a'],
      '2026-01-06': ['a']
    }));

    expect(logModel.getConsecutiveLogDays()).toBe(3);
  });

  test('ログが1日だけなら 1', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-02': ['a']
    }));

    expect(logModel.getConsecutiveLogDays()).toBe(1);
  });

  test('ログがなければ 0', () => {
    expect(logModel.getConsecutiveLogDays()).toBe(0);
  });

});

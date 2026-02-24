/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/logModel.js');
});

describe('logModel.getLastSmokeTime', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('複数日から最新時刻を返す', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': ['2026-01-01T20:00:00+09:00'],
      '2026-01-02': ['2026-01-02T09:00:00+09:00']
    }));

    const last = logModel.getLastSmokeTime();
    expect(last.toISOString())
      .toBe(new Date('2026-01-02T09:00:00+09:00').toISOString());
  });

  test('ログが空なら null', () => {
    expect(logModel.getLastSmokeTime()).toBeNull();
  });

});

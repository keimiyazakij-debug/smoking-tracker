/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

// beforeAll or beforeEach で読み込む
beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('getLastSmokeTime', () => {

  test('複数日のログから最新の喫煙時刻を返す', () => {
    const logs = {
      '2026-01-01': [
        '2026-01-01T08:00:00+09:00',
        '2026-01-01T20:00:00+09:00'
      ],
      '2026-01-02': [
        '2026-01-02T07:30:00+09:00'
      ]
    };

    const last = window.common.getLastSmokeTime(logs);

    expect(last).not.toBeNull();
    expect(typeof last.getTime).toBe('function');

    expect(last.toISOString())
      .toBe(new Date('2026-01-02T07:30:00+09:00').toISOString());
  });

  test('ログの配列順・日付順に依存しない', () => {
    const logs = {
      '2026-01-02': [
        '2026-01-02T07:30:00+09:00'
      ],
      '2026-01-01': [
        '2026-01-01T20:00:00+09:00',
        '2026-01-01T08:00:00+09:00'
      ]
    };

    const last = window.common.getLastSmokeTime(logs);

    expect(last.toISOString())
      .toBe(new Date('2026-01-02T07:30:00+09:00').toISOString());
  });

  test('ログが空の場合は null を返す', () => {
    const logs = {};
    expect(window.common.getLastSmokeTime(logs)).toBeNull();
  });

});

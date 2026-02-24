/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  // common / calendarModel 本体
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/calendarModel.js');
});

describe('calendarModel.buildCalendarData', () => {

  function log(date, count = 0) {
    return { date, count, status: count > 0 ? 'smoke' : 'success' };
  }

  test('日付が飛んでいる場合は補完せず、存在キーのみ返す', () => {
    const logs = [
      log('2026-01-01', 3),
      log('2026-01-03', 2),
    ];

    const calendar =
      window.calendarModel.buildCalendarData(logs);

    expect(calendar['2026-01-02']).toBeUndefined();
    expect(calendar['2026-01-01']).toBeDefined();
    expect(calendar['2026-01-03']).toBeDefined();
  });

  // ====================
  // ③ 空・null
  // ====================
  test('ログが空配列でも例外にならず空オブジェクトを返す', () => {
    const calendar =
      window.calendarModel.buildCalendarData([]);

    expect(calendar).toBeDefined();
    expect(Object.keys(calendar).length).toBe(0);
  });

  test('ログが null でも例外にならない', () => {
    expect(() => {
      window.calendarModel.buildCalendarData(null);
    }).not.toThrow();
  });

  // ====================
  // ④ 並び順
  // ====================
  test('日付キーは昇順で並ぶ', () => {
    const logs = [
      log('2026-01-03', 1),
      log('2026-01-01', 1),
      log('2026-01-02', 1),
    ];

    const calendar =
      window.calendarModel.buildCalendarData(logs);

    const keys = Object.keys(calendar);

    expect(keys).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
  });

  test('memo専用データは unrecorded としてマージされる', () => {
    const logs = [log('2026-01-01', 1)];
    const calendar = window.calendarModel.buildCalendarData(logs, null, {
      '2026-01-02': 'メモだけ',
    });
    expect(calendar['2026-01-02']).toEqual({
      count: null,
      status: 'unrecorded',
      memo: 'メモだけ',
    });
  });

});

describe('calendarModel.resetToToday', () => {
  test('year / month が現在日にリセットされる', () => {
    // 強制的に別月へ
    window.calendarModel.state.year = 2025;
    window.calendarModel.state.month = 0;

    window.calendarModel.resetToToday();

    const now = new Date();
    expect(window.calendarModel.state.year).toBe(now.getFullYear());
    expect(window.calendarModel.state.month).toBe(now.getMonth());
  });
});

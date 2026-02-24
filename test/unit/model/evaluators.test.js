/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/dailyTaskModel.js');
});

beforeEach(() => {
  localStorage.clear();
});

describe('evaluator via dailyTaskModel.evaluate', () => {

  test('record: hasRecordToday=true のとき daily イベントが発火する', () => {
    global.DAILY_TASKS = [
      { id: 'CHECK_IN', rule: 'record' }
    ];

    const events = window.dailyTaskModel.evaluate({
      todayKey: '2026-01-02',
      hasRecordToday: true,
      isToday: true,
      nowHour: 10
    });

    expect(events).toHaveLength(1);
    expect(events[0].taskId).toBe('CHECK_IN');
  });

  test('timeband: 当日・時間帯未終了では発火しない', () => {
    global.DAILY_TASKS = [
      { id: 'NO_SMOKE_NOON', rule: 'timeband', from: 12, to: 14 }
    ];

    const events = window.dailyTaskModel.evaluate({
      todayKey: '2026-01-02',
      isToday: true,
      nowHour: 13,
      countBetween: () => 0
    });

    expect(events).toHaveLength(0);
  });

  test('timeband: 当日・時間帯終了後で0本なら発火する', () => {
    global.DAILY_TASKS = [
      { id: 'NO_SMOKE_NOON', rule: 'timeband', from: 12, to: 14 }
    ];

    const events = window.dailyTaskModel.evaluate({
      todayKey: '2026-01-02',
      isToday: true,
      nowHour: 14,
      countBetween: () => 0
    });

    expect(events).toHaveLength(1);
  });

  test('timeband: 過去日は時刻無視で判定される', () => {
    global.DAILY_TASKS = [
      { id: 'NO_SMOKE_NOON', rule: 'timeband', from: 12, to: 14 }
    ];

    const events = window.dailyTaskModel.evaluate({
      todayKey: '2026-01-01',
      isToday: false,
      countBetween: () => 0
    });

    expect(events).toHaveLength(1);
  });

  test('timeband: 喫煙ありの場合は発火しない', () => {
    global.DAILY_TASKS = [
      { id: 'NO_SMOKE_NOON', rule: 'timeband', from: 12, to: 14 }
    ];

    const events = window.dailyTaskModel.evaluate({
      todayKey: '2026-01-02',
      isToday: true,
      nowHour: 14,
      countBetween: () => 2
    });

    expect(events).toHaveLength(0);
  });

});

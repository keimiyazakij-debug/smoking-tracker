/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/dailyTaskModel.js');
});

describe('dailyTaskModel.evaluate', () => {
  beforeEach(() => {
    global.DAILY_TASKS = [
      {
        id: 'CHECK_IN',
        label: 'チェックイン',
        rule: 'record'
      }
    ];
  });

  test('同じ日に条件を満たすと daily イベントが発火する', () => {
    const ctx = {
      todayKey: '2026-01-02',
      hasRecordToday: true,
      isToday: true,
      nowHour: 12
    };

    const events = window.dailyTaskModel.evaluate(ctx);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: 'daily',
      dateKey: '2026-01-02',
      taskId: 'CHECK_IN'
    });
  });

  test('条件を満たさない場合はイベントが発火しない', () => {
    const ctx = {
      todayKey: '2026-01-02',
      hasRecordToday: false,
      isToday: true,
      nowHour: 12
    };

    const events = window.dailyTaskModel.evaluate(ctx);
    expect(events).toHaveLength(0);
  });
});

describe('dailyTaskModel.evaluateTasks', () => {
  beforeEach(() => {
    global.DAILY_TASKS = [
      {
        id: 'CHECK_IN',
        label: 'チェックイン',
        rule: 'record'
      },
      {
        id: 'NO_SMOKE_MORNING',
        label: '午前中を禁煙で過ごせた',
        rule: 'timeband',
        from: 0,
        to: 12
      }
    ];
  });

  test('未達成のタスクは done=false で返る', () => {
    const ctx = {
      todayKey: '2026-01-02',
      hasRecordToday: false,
      isToday: true,
      nowHour: 10,
      countBetween: () => 1 // 午前中に吸っている
    };

    const tasks = window.dailyTaskModel.evaluateTasks(ctx);

    expect(tasks).toEqual([
      { id: 'CHECK_IN', label: 'チェックイン', done: false },
      { id: 'NO_SMOKE_MORNING', label: '午前中を禁煙で過ごせた', done: false }
    ]);
  });

  test('条件を満たしたタスクは done=true になる', () => {
    const ctx = {
      todayKey: '2026-01-02',
      hasRecordToday: true,
      isToday: true,
      nowHour: 12,
      countBetween: () => 0 // 午前中は禁煙
    };

    const tasks = window.dailyTaskModel.evaluateTasks(ctx);

    expect(tasks).toEqual([
      { id: 'CHECK_IN', label: 'チェックイン', done: true },
      { id: 'NO_SMOKE_MORNING', label: '午前中を禁煙で過ごせた', done: true }
    ]);
  });

  test('同じ ctx を再評価しても結果は安定する', () => {
    const ctx = {
      todayKey: '2026-01-02',
      hasRecordToday: true,
      isToday: true,
      nowHour: 12,
      countBetween: () => 0
    };

    const first = window.dailyTaskModel.evaluateTasks(ctx);
    const second = window.dailyTaskModel.evaluateTasks(ctx);

    expect(second).toEqual(first);
  });
});

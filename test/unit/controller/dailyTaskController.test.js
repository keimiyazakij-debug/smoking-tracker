/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('dailyTaskController', () => {
  beforeEach(() => {
    // ===== common モック =====
    window.common = {
      getDateKey: jest.fn(() => '2026-02-01'),
      parseDateKey: jest.fn(d => new Date(d)),
      buildContext: jest.fn(ctx => ctx),
      calculateStats: jest.fn(() => ({
        goalStreak: 0,
        dailyStreak: 0,
        downStreak: 0,
      })),
    };
    window.logModel = {
      getLogs: jest.fn(() => ({})),
    };

    // ===== Model / View =====
    window.dailyTaskModel = {
      evaluate: jest.fn(ctx => ctx),
      evaluateTasks: jest.fn(() => []), // ★ ここが重要
    };

    window.dailyTaskView = {
      open: jest.fn(),
      isOpen: jest.fn(() => false),
    };

    window.appSettings = {};

    // ===== Controller 読み込み =====
    loadBrowserScript(
      '../app/controller/dailyTaskController.js',
      {
        common: window.common,
        logModel: window.logModel,
        dailyTaskModel: window.dailyTaskModel,
        dailyTaskView: window.dailyTaskView,
        appSettings: window.appSettings,
      }
    );

    jest.clearAllMocks();
  });

  // =========================
  // open / openToday
  // =========================
  describe('open / openToday', () => {
    test('openToday: 今日キーで View を開く', () => {
      window.dailyTaskController.openToday();

      expect(window.dailyTaskModel.evaluateTasks).toHaveBeenCalled();
      expect(window.dailyTaskView.open)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            dateKey: '2026-02-01',
            title: '今日のチャレンジ',
            tasks: [],
            canNext: false,
          })
        );
    });

    test('open: 指定日で View を開く', () => {
      window.dailyTaskController.open('2026-01-01');

      expect(window.dailyTaskModel.evaluateTasks).toHaveBeenCalled();
      expect(window.dailyTaskView.open)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            dateKey: '2026-01-01',
            title: '2026-01-01 のチャレンジ',
            tasks: [],
            canNext: true,
          })
        );
    });

    test('open: 最多時間帯のタスクが today recommendation になる', () => {
      window.logModel.getLogs.mockReturnValue({
        '2026-02-01': [
          '2026-02-01T12:10:00',
          '2026-02-01T14:20:00',
          '2026-02-01T17:40:00'
        ],
      });
      window.dailyTaskModel.evaluateTasks.mockReturnValue([
        { id: 'deep_night_reduce', label: '深夜の1本を控えてみる。', done: false },
        { id: 'morning_reduce', label: '朝の1本を減らしてみる。', done: false },
        { id: 'late_morning_reduce', label: '午前を少し軽くしてみる。', done: false },
        { id: 'afternoon_reduce', label: '午後の1本を減らしてみる。', done: false },
        { id: 'night_reduce', label: '夜の1本を減らしてみる。', done: false },
      ]);

      window.dailyTaskController.openToday();

      expect(window.dailyTaskView.open).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendedTaskId: 'afternoon_reduce',
          recommendedTaskLabel: '午後の1本を減らしてみる。',
        })
      );
    });

    test('open: 深夜が1本のみの場合は推薦候補から除外される', () => {
      window.logModel.getLogs.mockReturnValue({
        '2026-02-01': [
          '2026-02-01T01:20:00',
          '2026-02-01T19:10:00'
        ],
      });
      window.dailyTaskModel.evaluateTasks.mockReturnValue([
        { id: 'deep_night_reduce', label: '深夜の1本を控えてみる。', done: false },
        { id: 'morning_reduce', label: '朝の1本を減らしてみる。', done: false },
        { id: 'late_morning_reduce', label: '午前を少し軽くしてみる。', done: false },
        { id: 'afternoon_reduce', label: '午後の1本を減らしてみる。', done: false },
        { id: 'night_reduce', label: '夜の1本を減らしてみる。', done: false },
      ]);

      window.dailyTaskController.openToday();

      expect(window.dailyTaskView.open).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendedTaskId: 'night_reduce',
          recommendedTaskLabel: '夜の1本を減らしてみる。',
        })
      );
    });
  });

  // =========================
  // move
  // =========================
  describe('move', () => {
    test('move: 過去日は遷移できる（open が再度呼ばれる）', () => {
      window.common.getDateKey.mockReturnValue('2026-02-02');

      window.dailyTaskController.open('2026-02-02');
      window.dailyTaskController.move(-1);

      expect(window.dailyTaskView.open).toHaveBeenCalledTimes(2);
    });

    test('move: 未来日は遷移しない', () => {
      window.common.getDateKey
        .mockReturnValueOnce('2026-02-02') // nextKey
        .mockReturnValueOnce('2026-02-01'); // todayKey

      window.dailyTaskController.open('2026-02-01');
      window.dailyTaskView.open.mockClear();
      window.dailyTaskController.move(1);

      expect(window.dailyTaskView.open).toHaveBeenCalledTimes(1);
    });
  });

  // =========================
  // evaluate
  // =========================
  describe('evaluate', () => {
    test('evaluate: Model.evaluate に委譲し、戻り値を返す', () => {
      const ctx = { dummy: true };

      const r = window.dailyTaskController.evaluate(ctx);

      expect(window.dailyTaskModel.evaluate).toHaveBeenCalledWith(ctx);
      expect(r).toBe(ctx);
    });
  });

  // =========================
  // checkAchievement
  // =========================
  describe('checkAchievement', () => {
    test('未達成なら何もしない', () => {
      window.common.calculateStats.mockReturnValue({
        goalStreak: 0,
        dailyStreak: 0,
        downStreak: 0,
      });

      window.dailyTaskController.checkAchievement({ todayKey: '2026-02-01' });

      expect(window.dailyTaskView.open).not.toHaveBeenCalled();
    });

    test('達成時に View を開く', () => {
      window.common.calculateStats.mockReturnValue({
        goalStreak: 1,
        dailyStreak: 0,
        downStreak: 0,
      });

      window.dailyTaskController.checkAchievement({ todayKey: '2026-02-01' });

      expect(window.dailyTaskModel.evaluateTasks).toHaveBeenCalled();
      expect(window.dailyTaskView.open)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            dateKey: '2026-02-01',
            title: '2026-02-01 のチャレンジ',
            tasks: [],
          })
        );
    });

    test('同一日は二重通知しない', () => {
      window.common.calculateStats.mockReturnValue({
        goalStreak: 1,
        dailyStreak: 0,
        downStreak: 0,
      });

      const ctx = { todayKey: '2026-02-01' };

      window.dailyTaskController.checkAchievement(ctx);
      window.dailyTaskController.checkAchievement(ctx);

      expect(window.dailyTaskView.open).toHaveBeenCalledTimes(1);
    });

    test('日付が変われば再通知される', () => {
      window.common.calculateStats.mockReturnValue({
        goalStreak: 1,
        dailyStreak: 0,
        downStreak: 0,
      });

      window.dailyTaskController.checkAchievement({ todayKey: '2026-02-01' });
      window.dailyTaskController.checkAchievement({ todayKey: '2026-02-02' });

      expect(window.dailyTaskView.open).toHaveBeenCalledTimes(2);
    });

    test('ctx 不正時は何もしない', () => {
      window.dailyTaskController.checkAchievement(null);
      window.dailyTaskController.checkAchievement({});

      expect(window.dailyTaskView.open).not.toHaveBeenCalled();
    });
  });

  test('open(dateKey): ctx.todayKey は open した日になる', () => {
    window.dailyTaskController.open('2026-02-05');

    expect(window.common.buildContext).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: '2026-02-05'
      })
    );
  });

  test('refreshCurrentIfOpen: 開いているときだけ再表示する', () => {
    window.dailyTaskView.isOpen.mockReturnValue(false);
    window.dailyTaskController.refreshCurrentIfOpen();
    expect(window.dailyTaskView.open).not.toHaveBeenCalled();

    window.dailyTaskView.isOpen.mockReturnValue(true);
    window.dailyTaskController.open('2026-02-01');
    window.dailyTaskView.open.mockClear();

    window.dailyTaskController.refreshCurrentIfOpen();
    expect(window.dailyTaskView.open).toHaveBeenCalledTimes(1);
  });
});

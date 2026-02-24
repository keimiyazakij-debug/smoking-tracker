/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('scenario: dayFlow.up (悪化)', () => {

  beforeAll(() => {
    loadBrowserScript('../app/common/constant.js');
    loadBrowserScript('../app/common/common.js');

    loadBrowserScript('../app/model/calendarModel.js');
    loadBrowserScript('../app/model/dailyTaskModel.js');
    loadBrowserScript('../app/model/badgeModel.js');

    loadBrowserScript('../app/controller/dailyTaskController.js');
    loadBrowserScript('../app/controller/badgeController.js');
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    window.dailyTaskView = { open: jest.fn() };
    window.badgeView = { grant: jest.fn(), render: jest.fn() };

    window.settingModel = {
      loadSettings: jest.fn(() => ({ dailyTarget: 10 }))
    };
    window.logModel = {
      getLogs: jest.fn(() => {
        try {
          return JSON.parse(localStorage.getItem('dailyLogs') || '{}');
        } catch {
          return {};
        }
      })
    };

    window.BADGES = [
      {
        id: 'success_0',
        label: '禁煙達成',
        check: (ctx) => ctx.dailyStreak >= 1
      }
    ];
  });

  test('昨日より増えた場合、dailyTask / badge は発火しない', () => {
    // ===== ログ（前日2本 → 今日5本）=====
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': [
        '2026-01-01T09:00:00',
        '2026-01-01T18:00:00'
      ],
      '2026-01-02': [
        '2026-01-02T08:00:00',
        '2026-01-02T10:00:00',
        '2026-01-02T13:00:00',
        '2026-01-02T16:00:00',
        '2026-01-02T20:00:00'
      ]
    }));

    // ===== ctx を buildContext で生成 =====
    const ctx = window.common.buildContext({
      now: new Date('2026-01-02T23:00:00'),
      logs: window.logModel.getLogs(),
      settings: window.settingModel.loadSettings(),
      dateKey: '2026-01-02'
    });

    // ===== dailyTask =====
    window.dailyTaskController.evaluate(ctx);
    window.dailyTaskController.open('2026-01-02');

    // 画面は開いてよい
    expect(window.dailyTaskView.open).toHaveBeenCalled();

    // ===== badge =====
    const events = window.badgeController.evaluateAndGrant(ctx);

    expect(events).toHaveLength(0);
    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

});

/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('scenario: dayFlow.success (0本)', () => {

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

  test('今日0本の場合、dailyTask と badge が発火する', () => {
    // ===== ログ（前日あり・今日0本）=====
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': [
        '2026-01-01T09:00:00',
        '2026-01-01T15:00:00'
      ],
      '2026-01-02': [] // 今日0本
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

    expect(window.dailyTaskView.open).toHaveBeenCalled();

    // ===== badge =====
    const events = window.badgeController.evaluateAndGrant(ctx);

    expect(events).toHaveLength(0);
    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

});

/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('scenario: dayFlow.firstDay (前日なし)', () => {

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
        id: 'down_1',
        label: '減煙',
        check: (ctx) => ctx.downStreak >= 1
      },
      {
        id: 'success_0',
        label: '禁煙達成',
        check: (ctx) => ctx.dailyStreak >= 1
      }
    ];
  });

  test('前日が無い場合、dailyTask は開くが badge は付与されない', () => {
    // ===== 今日のみログあり =====
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': [
        '2026-01-01T09:00:00',
        '2026-01-01T12:00:00',
        '2026-01-01T18:00:00'
      ]
    }));

    // ===== ctx は buildContext で生成 =====
    const ctx = window.common.buildContext({
      now: new Date('2026-01-01T23:00:00'),
      logs: window.logModel.getLogs(),
      settings: window.settingModel.loadSettings(),
      dateKey: '2026-01-01'
    });

    // ===== dailyTask =====
    window.dailyTaskController.evaluate(ctx);
    window.dailyTaskController.open('2026-01-01');

    expect(window.dailyTaskView.open).toHaveBeenCalled();

    // ===== badge =====
    const events = window.badgeController.evaluateAndGrant(ctx);

    expect(events).toHaveLength(0);
    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

});

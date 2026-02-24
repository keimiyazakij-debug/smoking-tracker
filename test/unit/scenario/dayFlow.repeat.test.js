/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('scenario: dayFlow.repeat', () => {

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
      }
    ];
  });

  test('同じ日を2回評価しても dailyTask / badge は二重に発火しない', () => {
    // ===== ログ（唯一の真実）=====
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-01': [
        '2026-01-01T09:00:00',
        '2026-01-01T11:00:00',
        '2026-01-01T13:00:00',
        '2026-01-01T15:00:00',
        '2026-01-01T18:00:00'
      ],
      '2026-01-02': [
        '2026-01-02T10:00:00',
        '2026-01-02T14:00:00',
        '2026-01-02T19:00:00'
      ]
    }));

    // ===== ctx を buildContext で生成 =====
    const ctx = window.common.buildContext({
      now: new Date('2026-01-02T23:00:00'),
      logs: window.logModel.getLogs(),
      settings: window.settingModel.loadSettings(),
      dateKey: '2026-01-02'
    });

    // ===== 1回目 =====
    window.dailyTaskController.evaluate(ctx);
    window.dailyTaskController.open('2026-01-02');
    window.badgeController.evaluateAndGrant(ctx);

    // ===== 2回目（同日・同条件）=====
    window.dailyTaskController.evaluate(ctx);
    window.dailyTaskController.open('2026-01-02');
    window.badgeController.evaluateAndGrant(ctx);

    // ===== 検証 =====
    // dailyTask は UI 操作なので抑制しない
    expect(window.dailyTaskView.open).toHaveBeenCalledTimes(2);

    // badge は重複付与されない
    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

});

/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('calendarModel.buildCalendarState', () => {

  beforeAll(() => {
    // common / calendarModel
    loadBrowserScript('../app/model/calendarModel.js');

    // 依存モック
    window.common = {
      getDateKey: jest.fn(),
    };
    window.logModel = {
      getLogs: jest.fn()
    };

    window.settingModel = {
      loadSettings: jest.fn(),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.appState = {
      todayKey: '2026-01-05'
    };
  });

  test('必要な UI state が揃う', () => {
    const logs = [
      { date: '2026-01-01', count: 3 },
      { date: '2026-01-02', count: 2 },
    ];

    window.logModel.getLogs.mockReturnValue(logs);
    window.common.getDateKey.mockReturnValue('2026-01-05');
    window.settingModel.loadSettings.mockReturnValue({
      dailyTarget: 10,
    });

    const state = window.calendarModel.buildCalendarState();

    expect(state).toHaveProperty('year');
    expect(state).toHaveProperty('month');

    expect(state.logs).toBe(logs);
    expect(state.todayKey).toBe('2026-01-05');
    expect(state.target).toBe(10);

    expect(state).toHaveProperty('firstDay');
    expect(state).toHaveProperty('lastDate');
    expect(state).toHaveProperty('prevLastDate');
  });

  test('logs が空でも例外にならない', () => {
    window.logModel.getLogs.mockReturnValue([]);
    window.common.getDateKey.mockReturnValue('2026-01-01');
    window.settingModel.loadSettings.mockReturnValue({
      dailyTarget: 10,
    });

    const state = window.calendarModel.buildCalendarState();

    expect(state.logs).toEqual([]);
  });

});

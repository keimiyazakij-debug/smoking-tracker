/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../helpers/loadBrowserScript.js';

describe('app initialization flow (bootstrap)', () => {
  beforeEach(() => {
    // ===== 必須DOM =====
    document.body.innerHTML = `
      <button id="smokeBtn"></button>
      <a id="dailyChallengeLink"></a>
      <div id="calendarGrid"></div>
    `;
    window.appState = {};
    
    // ===== Models =====
    window.badgeModel = {
      loadEarnedBadges: jest.fn(() => []),
    };

    window.logModel = {};
    window.settingModel = {};

    // ===== Common =====
    window.common = {
      getDateKey: jest.fn(() => '2026-02-01'),
      buildContext: jest.fn(ctx => ctx),
      groupLogsByDate: jest.fn(() => []),
    };

    // ===== Model =====
    window.logModel = {
      getLogs: jest.fn(() => []),
    };    

    window.settingModel = {
      loadSettings: jest.fn(() => ({})),
    };
    // ===== Controllers =====
    window.mainController = {
      initMain: jest.fn(),
    };

    window.calendarController = {
      showCalendar: jest.fn(),
      refresh: jest.fn(),
    };

    window.dailyTaskController = {
      evaluate: jest.fn(() => []),
    };

    window.badgeController = {
      updateBadges: jest.fn(() => []),
    };

    window.timelineController = {
      isOpenTimeline: jest.fn(() => false),
    };

    window.messageController = {
      enqueue: jest.fn(),
    };

    // ===== Views =====
    window.mainView = {
      render: jest.fn(),
    };

    window.badgeView = {
      render: jest.fn(),
    };

    // ===== appController 実体 =====
    loadBrowserScript('../app/controller/appController.js', {
      mainController: window.mainController,
      badgeModel: window.badgeModel,
      badgeView: window.badgeView,
      calendarController: window.calendarController,
      dailyTaskController: window.dailyTaskController,
      badgeController: window.badgeController,
      timelineController: window.timelineController,
      messageController: window.messageController,
      mainView: window.mainView,
      logModel: window.logModel,
      settingModel: window.settingModel,
      common: window.common,
    });
  });

  test('bootstrap で初期化フローが完走する', () => {
    expect(() => {
      window.appController.bootstrap();
    }).not.toThrow();

    expect(window.mainController.initMain).toHaveBeenCalled();
    expect(window.badgeView.render).toHaveBeenCalled();
    expect(window.calendarController.showCalendar).toHaveBeenCalled();
  });
});

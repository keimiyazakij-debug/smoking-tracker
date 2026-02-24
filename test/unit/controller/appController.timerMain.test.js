/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('appController timer update on main tab', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <header></header>
      <div id="main" class="tab active"></div>
      <div id="calendar" class="tab">
        <div class="calendar-header"></div>
        <div class="calendar-card"></div>
      </div>
      <div id="timeline" class="tab"></div>
      <nav><button data-tab="main"></button></nav>
    `;
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    const calHeader = document.querySelector('.calendar-header');
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 40 });
    Object.defineProperty(nav, 'offsetHeight', { configurable: true, value: 56 });
    Object.defineProperty(calHeader, 'offsetHeight', { configurable: true, value: 24 });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: { height: 800 }
    });

    window.appState = {};
    loadBrowserScript('../app/common/common.js');
    loadBrowserScript('../app/model/logModel.js');
    loadBrowserScript('../app/model/settingModel.js');

    window.mainController = { initMain: jest.fn() };
    window.badgeModel = { loadEarnedBadges: jest.fn(() => []) };
    window.badgeView = { render: jest.fn() };
    window.mainView = { render: jest.fn() };
    window.calendarModel = {
      buildCalendarData: jest.fn(() => ({})),
      resetToToday: jest.fn()
    };
    window.calendarController = { showCalendar: jest.fn(), refresh: jest.fn() };
    window.timelineController = {
      isOpenTimeline: jest.fn(() => false),
      ensureRendered: jest.fn()
    };
    window.dailyTaskController = {
      evaluate: jest.fn(() => []),
      refreshCurrentIfOpen: jest.fn()
    };
    window.badgeController = { updateBadges: jest.fn(() => []) };
    window.messageController = { enqueue: jest.fn() };

    loadBrowserScript('../app/controller/appController.js', {
      mainController: window.mainController,
      badgeModel: window.badgeModel,
      badgeView: window.badgeView,
      mainView: window.mainView,
      calendarModel: window.calendarModel,
      calendarController: window.calendarController,
      timelineController: window.timelineController,
      dailyTaskController: window.dailyTaskController,
      badgeController: window.badgeController,
      messageController: window.messageController,
      logModel: window.logModel,
      settingModel: window.settingModel,
      common: window.common,
      getComputedStyle: window.getComputedStyle
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('bootstrap 後、main タブが active のとき 60秒ごとに onLogChanged が走る', () => {
    window.appController.bootstrap();
    expect(window.mainView.render).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60 * 1000);
    expect(window.mainView.render).toHaveBeenCalledTimes(2);
  });
});


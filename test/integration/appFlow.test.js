/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../helpers/loadBrowserScript.js';

describe('app integration flow', () => {
  beforeEach(() => {
    // ===== 最小DOM =====
    document.body.innerHTML = `
      <div id="calendarGrid"></div>
      <section id="calendarDetail"></section>
      <div id="calendar" class="tab"></div>

      <div id="timeline" class="tab">
        <h2 id="timelineTitle"></h2>
        <div id="timelineSummary"></div>
        <button id="nextTimelineDay"></button>
      </div>

      <div id="editOverlay" class="hidden"></div>
    `;

    // ===== View =====
    window.calendarView = { render: jest.fn() };
    window.timelineView = { render: jest.fn() };
    window.editView = {
      open: jest.fn(),
      close: jest.fn(),
      render: jest.fn(),
    };
    window.mainView = { render: jest.fn() };

    // ===== Model =====
    window.calendarModel = {
      state: { year: 2026, month: 1 },
      setMonth: jest.fn((year, month) => {
        window.calendarModel.state.year = year;
        window.calendarModel.state.month = month;
      }),
      resetToToday: jest.fn(),
      buildCalendarState: jest.fn(() => ({
        year: 2026,
        month: 1,
        logs: [],
        todayKey: '2026-02-01',
        target: 10,
        firstDay: 0,
        lastDate: 28,
        prevLastDate: 31,
      })),
      buildCalendarData: jest.fn(() => ({
        '2026-02-01': { count: 2 },
      })),
      prevMonth: jest.fn(),
      nextMonth: jest.fn(),
    };

    window.editModel = {
      open: jest.fn(),
      close: jest.fn(),
      getState: jest.fn(() => ({
        dateKey: '2026-02-01',
        times: ['09:00'],
      })),
      save: jest.fn(),
    };

    window.logModel = {
      getConsecutiveLogDays: jest.fn(() => 1),
      getLogs: jest.fn(() => ({
        '2026-02-01': [
          '2026-02-01T09:05:00',
          '2026-02-01T15:10:00',
        ],
      })),
    };

    // ===== common =====
    window.common = {
      groupLogsByDate: jest.fn(() => []),
      getDayStatus: jest.fn((date, logs) => {
        const day = logs?.[date];
        if (day === undefined) return 'unrecorded';
        return day.length > 0 ? 'smoke' : 'success';
      }),
      getDateKey: jest.fn(() => '2026-02-01'),
      parseDateKey: jest.fn((key) => new Date(`${key}T00:00:00`)),
      isDateLocked: jest.fn(() => false),
      calculateStats: jest.fn(() => ({
        goalStreak: 0,
        dailyStreak: 0,
        downStreak: 0,
      })),
    };

    // ===== message =====
    window.messageController = {
      enqueue: jest.fn(),
    };

    window.onLogChanged = jest.fn();
    window.dailyDataModel = {
      syncCountsFromLogs: jest.fn(),
      loadDailyData: jest.fn(() => ({
        '2026-02-01': 'メモ',
      })),
      upsertMemo: jest.fn(),
    };

    // ===== Controller load（順序重要）=====
    loadBrowserScript('../app/controller/timelineController.js', {
      timelineView: window.timelineView,
      editController: null, // 後で差し替え
    });

    loadBrowserScript('../app/controller/editController.js', {
      editModel: window.editModel,
      editView: window.editView,
      messageController: window.messageController,
      onLogChanged: window.onLogChanged,
    });

    // timelineController → editController 接続
    window.timelineController.editController = window.editController;

    loadBrowserScript('../app/controller/calendarController.js', {
      calendarModel: window.calendarModel,
      calendarView: window.calendarView,
      timelineController: window.timelineController,
      editController: window.editController,
      dailyDataModel: window.dailyDataModel,
      common: window.common,
    });
  });

  test('calendar → timeline → edit → save が一連でつながる', () => {
    // カレンダー表示
    window.calendarController.showCalendar();
    expect(window.calendarView.render).toHaveBeenCalled();

    // 日付クリックで詳細表示
    window.calendarController.onDayClick('2026-02-01');
    const button = document.querySelector('#calendarDetail .calendar-detail-link-btn');
    expect(button).not.toBeNull();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // 詳細リンクからタイムラインが開く
    expect(window.timelineView.render)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          9: ['09:05'],
          15: ['15:10'],
        })
      );

    // タイムラインから編集
    window.timelineController.openEditFromTimeline();
    expect(window.editView.open).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: '2026-02-01',
        title: '記録を編集',
      })
    );

    // 保存
    window.editController.saveEdit();

    expect(window.editModel.save).toHaveBeenCalled();
    expect(window.messageController.enqueue).toHaveBeenCalled();
    expect(window.onLogChanged).toHaveBeenCalledWith('2026-02-01');
  });
});

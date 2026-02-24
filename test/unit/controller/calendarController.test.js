/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('calendarController', () => {
  let sessionStorageMock;
  let logsStore;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="calendar"></div>
      <section id="calendarDetail"></section>
    `;

    const sessionStore = new Map();
    sessionStorageMock = {
      getItem: jest.fn((key) => sessionStore.get(key) ?? null),
      setItem: jest.fn((key, value) => sessionStore.set(key, value)),
      removeItem: jest.fn((key) => sessionStore.delete(key)),
    };

    window.common = {
      getDayStatus: jest.fn((date, logs) => {
        const day = logs?.[date];
        if (day === undefined) return 'unrecorded';
        return day.length > 0 ? 'smoke' : 'success';
      }),
      isDateLocked: jest.fn(() => false),
      parseDateKey: jest.fn((key) => new Date(`${key}T00:00:00`)),
      getDateKey: jest.fn((d = new Date()) => d.toISOString().slice(0, 10)),
    };

    window.calendarModel = {
      state: { year: 2026, month: 0 },
      setMonth: jest.fn((year, month) => {
        window.calendarModel.state.year = year;
        window.calendarModel.state.month = month;
      }),
      resetToToday: jest.fn(() => {
        window.calendarModel.state.year = 2026;
        window.calendarModel.state.month = 0;
      }),
      prevMonth: jest.fn(),
      nextMonth: jest.fn(),
      buildCalendarState: jest.fn(() => ({
        year: 2026,
        month: 0,
        logs: logsStore,
        todayKey: '2026-01-05',
        target: 10,
        firstDay: 4,
        lastDate: 31,
        prevLastDate: 31,
      })),
      buildCalendarData: jest.fn(() => ({
        '2026-01-01': { count: 1, status: 'smoke', memo: 'メモあり' },
        '2026-01-02': { count: 0, status: 'success' },
        '2026-01-05': { count: 0, status: 'success' },
      })),
    };

    window.dailyDataModel = {
      syncCountsFromLogs: jest.fn(),
      loadDailyData: jest.fn(() => ({
        '2026-01-01': 'メモあり',
      })),
      upsertMemo: jest.fn(),
    };

    window.calendarView = {
      render: jest.fn(),
    };

    window.timelineController = {
      openTimeline: jest.fn(),
    };
    logsStore = {
      '2026-01-01': ['2026-01-01T09:00:00.000Z'],
      '2026-01-02': [],
    };
    window.logModel = {
      getLogs: jest.fn(() => logsStore),
      setLogs: jest.fn((nextLogs) => {
        logsStore = nextLogs;
      }),
    };
    window.messageController = {
      enqueue: jest.fn(),
    };
    window.onLogChanged = jest.fn();

    loadBrowserScript('../app/controller/calendarController.js', {
      calendarModel: window.calendarModel,
      calendarView: window.calendarView,
      timelineController: window.timelineController,
      messageController: window.messageController,
      dailyDataModel: window.dailyDataModel,
      common: window.common,
      logModel: window.logModel,
      onLogChanged: window.onLogChanged,
      sessionStorage: sessionStorageMock,
    });

    jest.clearAllMocks();
  });

  test('showCalendar: 復元情報が無い場合は resetToToday 後に render する', () => {
    window.calendarController.showCalendar();

    expect(window.calendarModel.resetToToday).toHaveBeenCalled();
    expect(window.calendarView.render).toHaveBeenCalledTimes(1);
  });

  test('prevMonth: model を更新して render する', () => {
    window.calendarController.prevMonth();

    expect(window.calendarModel.prevMonth).toHaveBeenCalled();
    expect(window.calendarView.render).toHaveBeenCalled();
  });

  test('nextMonth: model を更新して render する', () => {
    window.calendarController.nextMonth();

    expect(window.calendarModel.nextMonth).toHaveBeenCalled();
    expect(window.calendarView.render).toHaveBeenCalled();
  });

  test('refresh: render を行う', () => {
    window.calendarController.refresh();
    expect(window.calendarView.render).toHaveBeenCalledTimes(1);
  });

  test('renderCalendar: dailyData を渡して buildCalendarData する', () => {
    window.calendarController.showCalendar();

    expect(window.dailyDataModel.syncCountsFromLogs).toHaveBeenCalled();
    expect(window.calendarModel.buildCalendarData).toHaveBeenCalledWith(
      [
        { date: '2026-01-01', count: 1, status: 'smoke' },
        { date: '2026-01-02', count: 0, status: 'success' }
      ],
      '2026-01-05',
      { '2026-01-01': 'メモあり' }
    );
  });

  test('fetchHolidays: キャッシュがある年は API を呼ばない', async () => {
    const cached = [{ date: '2026-01-01', localName: '元日', name: "New Year's Day" }];
    localStorage.setItem('holidays_2026', JSON.stringify(cached));
    const originalFetch = window.fetch;
    const fetchMock = jest.fn();
    window.fetch = fetchMock;

    const holidays = await window.calendarController.fetchHolidays(2026);

    expect(holidays).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
    window.fetch = originalFetch;
  });

  test('isHoliday: 日付が祝日一覧に含まれるか判定できる', () => {
    const holidays = [
      { date: '2026-01-01', localName: '元日', name: "New Year's Day" },
    ];
    expect(window.calendarController.isHoliday('2026-01-01', holidays)).toBe(true);
    expect(window.calendarController.isHoliday('2026-01-02', holidays)).toBe(false);
  });

  test('onDayClick: ロック日でなければ selectedDateKey を更新して render する', () => {
    window.calendarController.showCalendar();
    window.calendarView.render.mockClear();

    window.calendarController.onDayClick('2026-01-03');

    expect(window.calendarView.render).toHaveBeenCalled();
    const renderArg = window.calendarView.render.mock.calls.at(-1)[0];
    expect(renderArg.selectedDateKey).toBe('2026-01-03');
    expect(window.timelineController.openTimeline).not.toHaveBeenCalled();
  });

  test('onDayClick: ロック日付は遷移せず premium メッセージを出す', () => {
    window.common.isDateLocked.mockReturnValue(true);

    window.calendarController.onDayClick('2026-01-01');

    expect(window.timelineController.openTimeline).not.toHaveBeenCalled();
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'premium_lock',
      text: '60日より前のデータはプレミアム版で閲覧できます。',
      priority: -1,
    });
  });

  test('「この日の記録を見る」ボタンで timeline を開く', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-01');

    const button = document.querySelector('#calendarDetail .calendar-detail-link-btn');
    expect(button).not.toBeNull();
    button.click();

    expect(window.timelineController.openTimeline).toHaveBeenCalledWith('2026-01-01', {
      from: 'calendar',
      sourceDateKey: '2026-01-01',
      updateHistory: true,
    });
  });

  test('ログ未存在かつ初回記録日以降の日付では「禁煙成功で確定」ボタンを表示する', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-03');

    const successBtn = document.querySelector('#calendarDetail .calendar-detail-success-btn');
    expect(successBtn).not.toBeNull();
  });

  test('今日は「禁煙成功で確定」ボタンを表示しない', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-05');

    const successBtn = document.querySelector('#calendarDetail .calendar-detail-success-btn');
    expect(successBtn).toBeNull();
  });

  test('「禁煙成功で確定」押下で空配列ログを作成する', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-03');

    const successBtn = document.querySelector('#calendarDetail .calendar-detail-success-btn');
    expect(successBtn).not.toBeNull();
    successBtn.click();

    expect(window.logModel.setLogs).toHaveBeenCalledTimes(1);
    expect(logsStore['2026-01-03']).toEqual([]);
    expect(window.onLogChanged).toHaveBeenCalledWith('2026-01-03');
  });

  test('過去日で0本なら禁煙達成メッセージを表示する', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-02');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine).not.toBeNull();
    expect(statusLine.textContent).toBe('🏆今日は禁煙達成です');
    expect(statusLine.classList.contains('memo-status-line--blue')).toBe(true);
  });

  test('前日比が増加ならオレンジメッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-01': { count: 1, status: 'smoke' },
      '2026-01-02': { count: 3, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-02');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('⚠前日より +2本');
    expect(statusLine.classList.contains('memo-status-line--orange')).toBe(true);
  });

  test('前日比が減少ならブルーメッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-01': { count: 5, status: 'smoke' },
      '2026-01-02': { count: 3, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-02');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('☆前日より -2本');
    expect(statusLine.classList.contains('memo-status-line--blue')).toBe(true);
  });

  test('2日連続で減少なら専用メッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-01': { count: 5, status: 'smoke' },
      '2026-01-02': { count: 4, status: 'smoke' },
      '2026-01-03': { count: 3, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-03');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('★二日連続で減少です');
    expect(statusLine.classList.contains('memo-status-line--blue')).toBe(true);
  });

  test('3日以上連続で減少なら継続メッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-01': { count: 5, status: 'smoke' },
      '2026-01-02': { count: 4, status: 'smoke' },
      '2026-01-03': { count: 3, status: 'smoke' },
      '2026-01-04': { count: 2, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-04');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('✨3日以上減少が継続');
    expect(statusLine.classList.contains('memo-status-line--blue')).toBe(true);
  });

  test('未確定日には前日比メッセージを表示しない', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-06');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine).not.toBeNull();
    expect(statusLine.textContent).toBe(' ');
  });

  test('当日で0本なら前日比メッセージは表示しない', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-04': { count: 3, status: 'smoke' },
      '2026-01-05': { count: 0, status: 'success' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-05');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe(' ');
  });

  test('当日で前日比が増加ならオレンジメッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-04': { count: 2, status: 'smoke' },
      '2026-01-05': { count: 5, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-05');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('⚠前日より +3本');
    expect(statusLine.classList.contains('memo-status-line--orange')).toBe(true);
  });

  test('当日で前日比が減少ならブルーメッセージを表示する', () => {
    window.calendarModel.buildCalendarData.mockReturnValue({
      '2026-01-04': { count: 5, status: 'smoke' },
      '2026-01-05': { count: 2, status: 'smoke' },
    });
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-05');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('☆前日より -3本');
    expect(statusLine.classList.contains('memo-status-line--blue')).toBe(true);
  });

  test('setInlineMessage: 常設メッセージがある日は上書きしない', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-02');

    window.calendarController.setInlineMessage('✅ 今日のチャレンジ達成');

    const statusLine = document.querySelector('#calendarDetail .memo-status-line');
    expect(statusLine.textContent).toBe('🏆今日は禁煙達成です');
  });

  test('setInlineMessage: 前日比がない日は一時メッセージを表示する', () => {
    jest.useFakeTimers();
    try {
      window.calendarController.showCalendar();
      window.calendarController.onDayClick('2026-01-06');

      window.calendarController.setInlineMessage('✅ 今日のチャレンジ達成');

      let statusLine = document.querySelector('#calendarDetail .memo-status-line');
      expect(statusLine.textContent).toBe('✅ 今日のチャレンジ達成');

      jest.advanceTimersByTime(3000);
      statusLine = document.querySelector('#calendarDetail .memo-status-line');
      expect(statusLine.textContent).toBe(' ');
    } finally {
      jest.useRealTimers();
    }
  });

  test('メモ編集中のオートセーブは画面を閉じず、blur で表示モードに戻る', () => {
    jest.useFakeTimers();
    try {
      window.calendarController.showCalendar();
      window.calendarController.onDayClick('2026-01-01');

      const editBtn = document.querySelector('#calendarDetail .memo-edit-btn');
      editBtn.click();
      expect(document.querySelector('#calendarDetail .memo-editor')).not.toBeNull();

      window.calendarView.render.mockClear();
      const textarea = document.querySelector('#calendarDetail .memo-editor');
      textarea.value = '編集中メモ';
      textarea.dispatchEvent(new Event('input'));

      jest.advanceTimersByTime(500);

      expect(window.dailyDataModel.upsertMemo).toHaveBeenCalledWith('2026-01-01', '編集中メモ');
      expect(window.calendarView.render).not.toHaveBeenCalled();
      expect(document.querySelector('#calendarDetail .memo-editor')).not.toBeNull();

      textarea.dispatchEvent(new Event('blur'));
      expect(window.calendarView.render).toHaveBeenCalled();
      expect(document.querySelector('#calendarDetail .memo-editor')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('編集中の refresh は再描画しない', () => {
    window.calendarController.showCalendar();
    window.calendarController.onDayClick('2026-01-01');
    document.querySelector('#calendarDetail .memo-edit-btn').click();

    window.calendarView.render.mockClear();
    window.calendarController.refresh();

    expect(window.calendarView.render).not.toHaveBeenCalled();
  });
});

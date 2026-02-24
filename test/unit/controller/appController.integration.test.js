/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  // ===== core =====
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/logModel.js');
  loadBrowserScript('../app/model/settingModel.js');

  // ===== 最小モック群 =====
  window.calendarModel = {
    buildCalendarData: jest.fn(() => ({})),
    resetToToday: jest.fn()
  };

  // ===== collaborator controllers =====
  window.calendarController = {
    showToday: jest.fn(),
    showCalendar: jest.fn(),
    refresh: jest.fn()
  };  

  window.dailyTaskController = {
    evaluate: jest.fn(() => [])
  };

  window.badgeController = {
    updateBadges: jest.fn(() => [])
  };

  window.messageController = {
    enqueue: jest.fn()
  };

  window.timelineController = {
    isOpenTimeline: jest.fn(() => false),
    closeTimeline: jest.fn(),
    openTimeline: jest.fn(),
    refreshCurrent: jest.fn()
  };

  // ===== views =====
  window.mainView = { render: jest.fn() };
  window.calendarView = { render: jest.fn() };
  window.badgeView = { render: jest.fn() };
  window.statsView = { bind: jest.fn() };
  window.statsController = {
    init: jest.fn(),
    render: jest.fn(),
    state: { baseDate: new Date('2026-01-01') }
  };
  // appController.js 内の statsController 直接参照対策
  globalThis.statsController = window.statsController;

  window.mainController = {
    initMain: jest.fn()
  };

  window.badgeModel = {
    loadEarnedBadges: jest.fn(() => ['badge-a'])
  };

  // ===== target =====
  loadBrowserScript('../app/controller/appController.js', {
    mainController: window.mainController,
    badgeModel: window.badgeModel,
    badgeView: window.badgeView,
    calendarController: window.calendarController,
    statsController: window.statsController,
    getComputedStyle: window.getComputedStyle
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  window.appState = { todayKey: '2026-01-01' };
  window._statsInitialized = false;
  window.editController = {
    isOpenEdit: jest.fn(() => false),
    refreshFromStorage: jest.fn()
  };
  window.dailyTaskController.refreshCurrentIfOpen = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('appController.onLogChanged (integration)', () => {

  describe('基本フロー', () => {
    test('例外を出さずに一連の処理が完走する', () => {
      expect(() => {
        onLogChanged();
      }).not.toThrow();

      expect(window.dailyTaskController.evaluate).toHaveBeenCalled();
      expect(window.badgeController.updateBadges).toHaveBeenCalled();
      expect(window.messageController.enqueue).toHaveBeenCalled();
      expect(window.mainView.render).toHaveBeenCalled();
      expect(window.calendarController.refresh).toHaveBeenCalled();
    });
  });

  describe('タイムライン表示中の分岐', () => {
    test('タイムライン表示中は指定日で再表示する', () => {
      window.timelineController.isOpenTimeline.mockReturnValue(true);

      onLogChanged('2026-01-02');

      expect(window.timelineController.openTimeline)
        .toHaveBeenCalledWith('2026-01-02', { updateHistory: false });
    });
  });

  describe('タイムライン表示中の再描画', () => {
    test('タイムライン表示中・date未指定でも mainView.render が呼ばれる', () => {
      window.timelineController.isOpenTimeline.mockReturnValue(true);
      window.mainView.render = jest.fn();
      window.timelineController.refreshCurrent = jest.fn();

      onLogChanged();

      expect(window.mainView.render).toHaveBeenCalledTimes(1);
      expect(window.timelineController.refreshCurrent).toHaveBeenCalledTimes(1);
    });

    test('タイムライン非表示時は mainView.render が呼ばれる', () => {
      // タイムライン非表示
      window.timelineController.isOpenTimeline.mockReturnValue(false);

      window.mainView.render = jest.fn();

      onLogChanged();

      expect(window.mainView.render).toHaveBeenCalledTimes(1);
    });

    test('date 指定ありでタイムライン表示中は main も timeline も更新される', () => {
      window.timelineController.isOpenTimeline.mockReturnValue(true);

      window.timelineController.openTimeline = jest.fn();
      window.mainView.render = jest.fn();

      onLogChanged('2026-01-10');

      expect(window.mainView.render).toHaveBeenCalledTimes(1);

      expect(window.timelineController.openTimeline)
        .toHaveBeenCalledWith('2026-01-10', { updateHistory: false });
    });
  });

});

describe('日付跨ぎ対応', () => {
  test('todayKey が変わった場合 calendarModel.resetToToday が呼ばれる', () => {
    // 初期 todayKey
    window.appState = { todayKey: '2026-01-01' };

    // getDateKey が翌日を返すようにする
    jest.spyOn(window.common, 'getDateKey')
      .mockReturnValue('2026-01-02');

    window.calendarModel.resetToToday = jest.fn();

    onLogChanged();

    expect(window.calendarModel.resetToToday).toHaveBeenCalledTimes(1);
  });

  test('todayKey が同じ場合 resetToToday は呼ばれない', () => {
    window.appState = { todayKey: '2026-01-02' };

    jest.spyOn(window.common, 'getDateKey')
      .mockReturnValue('2026-01-02');

    window.calendarModel.resetToToday = jest.fn();

    onLogChanged();

    expect(window.calendarModel.resetToToday).not.toHaveBeenCalled();
  });
});

describe('タイムライン表示中の定期更新', () => {
  test('date 未指定の onLogChanged では openTimeline が呼ばれない', () => {
    // タイムライン表示中を模擬
    window.timelineController.isOpenTimeline.mockReturnValue(true);

    // 念のため spy を明示
    window.timelineController.openTimeline = jest.fn();
    window.timelineController.refreshCurrent = jest.fn();

    // date を渡さずに呼ぶ（＝定期更新想定）
    onLogChanged();

    // open が走らないことを保証し、refreshCurrent が呼ばれる
    expect(window.timelineController.openTimeline).not.toHaveBeenCalled();
    expect(window.timelineController.refreshCurrent).toHaveBeenCalled();
  });

  test('date 指定ありの onLogChanged では openTimeline が呼ばれる', () => {
    window.timelineController.isOpenTimeline.mockReturnValue(true);

    window.timelineController.openTimeline = jest.fn();

    onLogChanged('2026-01-10');

    expect(window.timelineController.openTimeline)
      .toHaveBeenCalledWith('2026-01-10', { updateHistory: false });
  });
});

describe('showTab', () => {
  test('timeline タブ表示時は ensureRendered を呼ぶ', () => {
    document.body.innerHTML = `
      <div id="main" class="tab"></div>
      <div id="timeline" class="tab"></div>
      <nav>
        <button data-tab="main"></button>
        <button data-tab="timeline"></button>
      </nav>
    `;
    window.timelineController.ensureRendered = jest.fn();

    showTab('timeline');

    expect(window.timelineController.ensureRendered).toHaveBeenCalledTimes(1);
    expect(document.getElementById('timeline').classList.contains('active')).toBe(true);
  });

  test('stats タブは初回のみ bind/init される', () => {
    document.body.innerHTML = `
      <div id="main" class="tab"></div>
      <div id="stats" class="tab"></div>
      <nav>
        <button data-tab="main"></button>
        <button data-tab="stats"></button>
      </nav>
    `;
    window._statsInitialized = false;

    showTab('stats');
    showTab('stats');

    expect(window.statsView.bind).toHaveBeenCalledTimes(1);
    expect(window.statsController.init).toHaveBeenCalledTimes(1);
    expect(window._statsInitialized).toBe(true);
  });
});

describe('bootstrap / layout / events', () => {
  test('bootstrap: 初期化処理を実行しレイアウト変数を設定する', () => {
    document.body.innerHTML = `
      <header></header>
      <div id="calendar" class="tab" style="padding: 16px 0;">
        <div class="calendar-header"></div>
        <div class="calendar-card" style="padding: 8px 0;"></div>
      </div>
      <nav>
        <button data-tab="main"></button>
      </nav>
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
    window.appController.bootstrap();

    expect(window.mainController.initMain).toHaveBeenCalledTimes(1);
    expect(window.badgeModel.loadEarnedBadges).toHaveBeenCalledTimes(1);
    expect(window.badgeView.render).toHaveBeenCalled();
    expect(window.calendarController.showCalendar).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue('--header-height')).toBe('40px');
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('56px');
    expect(document.documentElement.style.getPropertyValue('--calendar-grid-height')).not.toBe('');
  });

  test('bootstrap: メイン以外のタブ表示中は定期更新で onLogChanged が走らない', () => {
    jest.useFakeTimers();
    window.history.replaceState({}, '', '/');
    document.body.innerHTML = `
      <header></header>
      <div id="main" class="tab"></div>
      <div id="timeline" class="tab active"></div>
      <div id="calendar" class="tab"></div>
      <nav>
        <button data-tab="main"></button>
      </nav>
    `;
    window.mainView.render.mockClear();

    window.appController.bootstrap();
    expect(window.mainView.render).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60 * 1000);
    expect(window.mainView.render).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('onLogChanged: stats/edit/dailyTask の追加分岐を通す', () => {
    window._statsInitialized = true;
    window.statsController = {
      render: jest.fn(),
      state: { baseDate: new Date('2026-01-01') }
    };
    globalThis.statsController = window.statsController;
    window.editController.isOpenEdit.mockReturnValue(true);

    onLogChanged('2026-01-20');

    expect(window.statsController.state.baseDate).toEqual(new Date('2026-01-20'));
    expect(window.statsController.render).toHaveBeenCalledTimes(1);
    expect(window.editController.refreshFromStorage).toHaveBeenCalledTimes(1);
    expect(window.dailyTaskController.refreshCurrentIfOpen).toHaveBeenCalledTimes(1);
  });

  test('visibilitychange: 前面復帰で日付更新時に today をリセットする', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    window.appState.todayKey = '2026-01-01';
    jest.spyOn(window.common, 'getDateKey').mockReturnValue('2026-01-02');

    document.dispatchEvent(new Event('visibilitychange'));

    expect(window.calendarModel.resetToToday).toHaveBeenCalledTimes(1);
    expect(window.calendarController.refresh).toHaveBeenCalledTimes(1);
  });

  test('storage: dailyLogs キー時のみ onLogChanged 相当が動く', () => {
    window.mainView.render.mockClear();

    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    expect(window.mainView.render).not.toHaveBeenCalled();

    window.dispatchEvent(new StorageEvent('storage', { key: 'dailyLogs' }));
    expect(window.mainView.render).toHaveBeenCalled();
  });
});

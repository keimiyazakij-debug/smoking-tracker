/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('timelineController（完全版）', () => {
  let pushStateSpy;
  let replaceStateSpy;

  beforeEach(() => {
    // ===== index.html 相当 DOM =====
    document.body.innerHTML = `
      <div id="timeline" class="tab">
        <a id="timelineBackLink"></a>
        <div id="timelineTitle"></div>
        <div id="timelineSummary"></div>
        <button id="nextTimelineDay"></button>
        <button id="timelineDeleteAllBtn"></button>
      </div>
    `;

    // ===== View / 他 Controller モック =====
    window.timelineView = {
      render: jest.fn(),
      setDateKey: jest.fn(),
      setSelectedSummary: jest.fn(),
    };

    window.editController = {
      openEdit: jest.fn(),
    };
    window.messageController = {
      enqueue: jest.fn(),
    };
    window.showTab = jest.fn();
    window.updateLayoutHeights = jest.fn();
    window.common = {
      getDateKey: jest.fn(d => d.toISOString().slice(0, 10)),
      parseDateKey: jest.fn(s => new Date(s)),
      isDateLocked: jest.fn(() => false),
    };
    window.logModel = {
      getLogs: jest.fn(() => ({
        '2026-02-01': [
          '2026-02-01T09:05:00',
          '2026-02-01T09:30:00',
          '2026-02-01T15:10:00',
        ],
      })),
    };
    pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});
    replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    // ===== Controller 読み込み =====
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        messageController: window.messageController,
        common: window.common,
        logModel: window.logModel,
      }
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    pushStateSpy?.mockRestore();
    replaceStateSpy?.mockRestore();
  });

  // =========================
  // openTimeline
  // =========================
  test('openTimeline: title を設定し、render を呼ぶ', () => {
    window.timelineController.openTimeline('2026-02-01');
    expect(window.showTab).toHaveBeenCalledWith('timeline', { updateHistory: false });

    expect(document.getElementById('timelineTitle').textContent)
      .toBe('2026/02/01');

    expect(document.getElementById('timelineSummary').textContent)
      .toBe('合計 3本');

    expect(window.timelineView.render)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          9: ['09:05', '09:30'],
          15: ['15:10'],
        })
      );
    expect(window.timelineView.setDateKey).toHaveBeenCalledWith('2026-02-01');
    expect(window.timelineView.setSelectedSummary).toHaveBeenCalledWith('2026-02-01', 3);
    expect(document.getElementById('timelineDeleteAllBtn').style.display).toBe('inline-block');
    expect(pushStateSpy).toHaveBeenCalledWith(
      { view: 'timeline', date: '2026-02-01', from: null, sourceDateKey: null },
      '',
      '/?view=timeline'
    );
  });

  // =========================
  // refreshTimeline
  // =========================
  test('refreshTimeline: title を更新し、render を呼ぶ', () => {
    window.timelineController.refreshTimeline('2026-02-02');

    expect(document.getElementById('timelineTitle').textContent)
      .toBe('2026/02/02');

    expect(window.timelineView.render)
      .toHaveBeenCalledWith(expect.any(Object));
    expect(window.timelineView.setDateKey).toHaveBeenCalledWith('2026-02-02');
    expect(window.timelineView.setSelectedSummary).toHaveBeenCalledWith('2026-02-02', 0);
  });

  test('refreshTimeline: setDateKey/setSelectedSummary が無くても描画できる', () => {
    window.timelineView = { render: jest.fn() };
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        common: window.common,
        logModel: window.logModel,
      }
    );

    expect(() => window.timelineController.refreshTimeline('2026-02-02')).not.toThrow();
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
  });

  // =========================
  // openEditFromTimeline
  // =========================
  test('openEditFromTimeline: dateKey 未設定時は何もしない', () => {
    window.timelineController.openEditFromTimeline();

    expect(window.editController.openEdit)
      .not.toHaveBeenCalled();
  });

  test('openEditFromTimeline: dateKey 設定後は edit を開く', () => {
    window.timelineController.openTimeline('2026-02-01');
    window.timelineController.openEditFromTimeline();

    expect(window.editController.openEdit)
      .toHaveBeenCalledWith('2026-02-01', {});
  });

  // =========================
  // closeTimeline
  // =========================
  test('closeTimeline: 呼び出してもエラーにならない', () => {
    expect(() => {
      window.timelineController.closeTimeline();
    }).not.toThrow();
    expect(window.showTab).toHaveBeenCalledWith('main', { updateHistory: false });
  });

  test('closeTimeline: showTab が無くてもエラーにならない', () => {
    window.showTab = undefined;
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        common: window.common,
        logModel: window.logModel,
      }
    );

    expect(() => window.timelineController.closeTimeline()).not.toThrow();
  });

  // =========================
  // isOpenTimeline
  // =========================
  test('isOpenTimeline: 表示中なら true', () => {
    const tab = document.getElementById('timeline');
    tab.classList.add('active');

    expect(window.timelineController.isOpenTimeline()).toBe(true);
  });

  test('isOpenTimeline: 非表示なら false', () => {
    const tab = document.getElementById('timeline');
    tab.classList.remove('active');

    expect(window.timelineController.isOpenTimeline()).toBe(false);
  });

  // =========================
  // refreshCurrent
  // =========================
  test('refreshCurrent: currentDateKey が未設定なら何もしない', () => {
    window.timelineController.refreshCurrent();
    expect(window.timelineView.render).not.toHaveBeenCalled();
  });

  test('refreshCurrent: currentDateKey があれば再描画する', () => {
    window.timelineController.openTimeline('2026-02-01');
    window.timelineView.render.mockClear();

    window.timelineController.refreshCurrent();

    expect(window.timelineView.render).toHaveBeenCalledWith(
      expect.objectContaining({
        9: ['09:05', '09:30'],
        15: ['15:10'],
      })
    );
  });

  test('goNextDay: 今日より先の日付には進まない', () => {
    const todayKey = window.common.getDateKey(new Date());
    window.timelineController.openTimeline(todayKey);
    window.timelineView.render.mockClear();
    // currentDateKey=今日 なので next は未来扱い
    window.timelineController.goNextDay();
    expect(window.timelineView.render).not.toHaveBeenCalled();
  });

  test('goNextDay: currentDateKey が未設定なら何もしない', () => {
    window.timelineController.goNextDay();
    expect(window.timelineView.render).not.toHaveBeenCalled();
  });

  test('goPrevDay: currentDateKey が未設定なら何もしない', () => {
    window.timelineController.goPrevDay();
    expect(window.timelineView.render).not.toHaveBeenCalled();
  });

  test('goPrevDay: 前日に移動して再描画する', () => {
    window.timelineController.openTimeline('2026-02-02');
    window.timelineView.render.mockClear();

    window.timelineController.goPrevDay();

    expect(document.getElementById('timelineTitle').textContent).toBe('2026/02/01');
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      { view: 'timeline', date: '2026-02-01', from: null, sourceDateKey: null },
      '',
      '/?view=timeline'
    );
  });

  test('goNextDay: 今日以前なら翌日に進んで再描画する', () => {
    const realTodayIso = new Date().toISOString().slice(0, 10);
    window.common.getDateKey.mockImplementation(d => {
      const iso = d.toISOString().slice(0, 10);
      return iso === realTodayIso ? '2026-02-03' : iso;
    });
    window.timelineController.openTimeline('2026-02-01');
    window.timelineView.render.mockClear();

    window.timelineController.goNextDay();

    expect(document.getElementById('timelineTitle').textContent).toBe('2026/02/02');
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
  });

  test('nextTimelineDay の visibility は今日より前で visible になる', () => {
    const realTodayIso = new Date().toISOString().slice(0, 10);
    window.common.getDateKey.mockImplementation(d => {
      const iso = d.toISOString().slice(0, 10);
      return iso === realTodayIso ? '2026-02-10' : iso;
    });

    window.timelineController.openTimeline('2026-02-01');

    expect(document.getElementById('nextTimelineDay').style.visibility).toBe('visible');
  });

  test('timelineView の補助メソッドが無くても openTimeline は動作する', () => {
    window.timelineView = { render: jest.fn() };
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        common: window.common,
        logModel: window.logModel,
      }
    );

    expect(() => window.timelineController.openTimeline('2026-02-01')).not.toThrow();
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
  });

  test('buildTimelineMap: 対象日以外の時刻は除外される', () => {
    window.logModel.getLogs.mockReturnValue({
      '2026-02-01': ['2026-02-02T09:00:00', '2026-02-01T10:00:00']
    });

    window.timelineController.openTimeline('2026-02-01');

    expect(window.timelineView.render).toHaveBeenCalledWith(
      expect.objectContaining({
        10: ['10:00']
      })
    );
    const map = window.timelineView.render.mock.calls[0][0];
    expect(map[9]).toBeUndefined();
  });

  test('deleteAllForCurrentDate: 日次キーを削除して再描画する', () => {
    const logs = { '2026-02-01': ['2026-02-01T09:05:00'] };
    window.logModel.getLogs.mockReturnValue(logs);
    window.logModel.setLogs = jest.fn();
    window.onLogChanged = jest.fn();

    window.timelineController.openTimeline('2026-02-01');
    window.timelineController.deleteAllForCurrentDate();

    expect(window.logModel.setLogs).toHaveBeenCalledWith({});
    expect(window.onLogChanged).toHaveBeenCalledWith('2026-02-01');
  });

  test('ensureRendered: currentDateKey 未設定時は今日で描画する', () => {
    const todayKey = window.common.getDateKey(new Date());
    window.timelineController.ensureRendered();
    expect(document.getElementById('timelineTitle').textContent).toBe(
      todayKey.replaceAll('-', '/')
    );
    expect(window.timelineView.render).toHaveBeenCalled();
  });

  test('ensureRendered: currentDateKey 設定済みならその日を維持して描画する', () => {
    window.timelineController.openTimeline('2026-02-01');
    window.timelineView.render.mockClear();

    window.timelineController.ensureRendered();

    expect(document.getElementById('timelineTitle').textContent).toBe('2026/02/01');
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
  });

  test('ensureRendered: preferredDateKey があればその日を優先して描画する', () => {
    window.timelineController.openTimeline('2026-02-01');
    window.timelineView.render.mockClear();

    window.timelineController.ensureRendered({ preferredDateKey: '2026-02-03' });

    expect(document.getElementById('timelineTitle').textContent).toBe('2026/02/03');
    expect(window.timelineView.render).toHaveBeenCalledTimes(1);
  });

  test('updateTimelineHeader: title/summary/nextBtn が無くてもエラーにならない', () => {
    document.body.innerHTML = `<div id="timeline" class="tab"></div>`;
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        common: window.common,
        logModel: window.logModel,
      }
    );

    expect(() => window.timelineController.openTimeline('2026-02-01')).not.toThrow();
  });

  test('openTimeline: ロック日付は renderLocked で表示する', () => {
    window.common.isDateLocked.mockReturnValue(true);
    window.timelineView.renderLocked = jest.fn();

    window.timelineController.openTimeline('2026-01-01');

    expect(window.timelineView.renderLocked).toHaveBeenCalled();
    expect(document.getElementById('timelineSummary').textContent)
      .toContain('プレミアム版');
    expect(window.timelineView.render).not.toHaveBeenCalled();
  });

  test('openEditFromTimeline: ロック日付は編集を開かない', () => {
    window.common.isDateLocked.mockReturnValue(true);
    window.timelineController.openTimeline('2026-01-01');

    window.timelineController.openEditFromTimeline();

    expect(window.editController.openEdit).not.toHaveBeenCalled();
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'premium_lock',
      text: '60日より前のデータはプレミアム版で閲覧できます。',
      priority: -1,
    });
  });

  test('goPrevDay: ロック日付には遷移せずトーストを表示する', () => {
    window.timelineController.openTimeline('2026-02-01');
    window.timelineView.render.mockClear();
    window.common.isDateLocked.mockImplementation((key) => key === '2026-01-31');

    window.timelineController.goPrevDay();

    expect(window.timelineView.render).not.toHaveBeenCalled();
    expect(document.getElementById('timelineTitle').textContent).toBe('2026/02/01');
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'premium_lock',
      text: '60日より前のデータはプレミアム版で閲覧できます。',
      priority: -1,
    });
  });

  test('開発サブパス配下でも timeline URL はベースパス付きで生成される', () => {
    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
    window.history.replaceState({}, '', '/dev/app/index.html');
    pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});
    replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        messageController: window.messageController,
        common: window.common,
        logModel: window.logModel,
      }
    );
    jest.clearAllMocks();

    window.timelineController.openTimeline('2026-02-01');

    expect(pushStateSpy).toHaveBeenCalledWith(
      { view: 'timeline', date: '2026-02-01', from: null, sourceDateKey: null },
      '',
      '/dev/app/?view=timeline'
    );
  });

  test('開発サブパス配下で from=calendar 戻る時はベースパスの calendar へ遷移する', () => {
    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
    window.history.replaceState({}, '', '/dev/app/index.html');
    pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});
    replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    loadBrowserScript(
      '../app/controller/timelineController.js',
      {
        timelineView: window.timelineView,
        editController: window.editController,
        messageController: window.messageController,
        common: window.common,
        logModel: window.logModel,
      }
    );
    jest.clearAllMocks();

    window.timelineController.openTimeline('2026-02-16', {
      from: 'calendar',
      sourceDateKey: '2026-02-16',
    });
    window.timelineController.goBack();

    expect(replaceStateSpy).toHaveBeenCalledWith(
      { view: 'calendar', date: '2026-02-16' },
      '',
      '/dev/app/?view=calendar&date=2026-02-16'
    );
  });

  test('from=calendar の場合、戻るリンク文言は「カレンダーに戻る」になる', () => {
    window.timelineController.openTimeline('2026-02-16', {
      from: 'calendar',
      sourceDateKey: '2026-02-16',
    });

    const link = document.getElementById('timelineBackLink');
    expect(link.textContent).toBe('← カレンダーに戻る');
    expect(link.getAttribute('href')).toContain('?view=calendar&date=2026-02-16');
  });

  test('戻るリンクの表示状態更新時に updateLayoutHeights を呼ぶ', () => {
    window.timelineController.openTimeline('2026-02-16', {
      from: 'calendar',
      sourceDateKey: '2026-02-16',
    });

    expect(window.updateLayoutHeights).toHaveBeenCalled();
  });
});

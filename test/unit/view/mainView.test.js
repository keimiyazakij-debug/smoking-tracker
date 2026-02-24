/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('mainView', () => {
  beforeEach(() => {
    // ===== index.html 相当の前提DOM =====
    document.body.innerHTML = `
      <div id="todayDisplay"></div>
      <div id="todayCountDisplay"></div>
      <div id="todayCountUnit"></div>
      <div id="todayTargetDisplay"></div>
      <div id="yesterdayDiff"></div>
      <div id="progress"></div>
      <div id="avg7Display"></div>
      <div id="thisWeekDisplay"></div>
      <div id="lastWeekDisplay"></div>
      <div id="undoSmokeWrap"><button id="undoSmokeBtn"></button></div>
      <div id="yesterdaySuccessWrap"><button id="yesterdaySuccessBtn"></button></div>
      <div id="statusLine"></div>
      <div id="since"></div>
    `;

    // ===== 依存モック =====
    window.loadSettings = jest.fn(() => ({
      dailyTarget: 10,
    }));

    window.formatDurationFromMinutes = jest.fn(m => `${m}分`);

    window.logModel = {
      getConsecutiveLogDays: jest.fn(() => 3),
      getLogs: jest.fn(() => ({
        '2026-02-01': ['2026-02-01T09:05:00'],
        '2026-01-31': [],
        '2026-01-30': ['2026-01-30T10:00:00', '2026-01-30T12:00:00'],
      })),
    };

    window.common = {
      parseDateKey: jest.fn(key => new Date(key)),
      getDateKey: jest.fn(d => d.toISOString().slice(0, 10))
    };

    // ===== View 読み込み（依存を inject）=====
    loadBrowserScript(
      '../app/view/mainView.js',
      {
        loadSettings: window.loadSettings,
        formatDurationFromMinutes: window.formatDurationFromMinutes,
        logModel: window.logModel,
        common: window.common,
      }
    );
  });

  test('render: 今日の日付と本数・進捗が表示される', () => {
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 3,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('todayDisplay').textContent)
      .toBe('2026-02-01');

    expect(document.getElementById('todayCountDisplay').textContent)
      .toBe('3');
    expect(document.getElementById('todayCountUnit').textContent)
      .toBe('本');
    expect(document.getElementById('todayTargetDisplay').textContent)
      .toBe('目標 10本');

    expect(document.getElementById('progress').style.width)
      .toBe('30%');

    expect(document.getElementById('progress').classList.contains('progress-green'))
      .toBe(true);

    expect(document.getElementById('undoSmokeWrap').style.display)
      .toBe('block');
  });

  test('render: 直近7日平均・今週・先週が表示される', () => {
    const ctx = {
      todayKey: '2026-02-01', // 2026-02-01 は日曜
      todayCount: 1,
      yesterdayCount: 0,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('avg7Display').textContent)
      .toContain('直近7日平均');
    expect(document.getElementById('thisWeekDisplay').textContent)
      .toContain('今週');
    expect(document.getElementById('lastWeekDisplay').textContent)
      .toContain('先週');
  });

  test('render: ステータス行に連続ログ日数が表示される', () => {
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 0,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('statusLine').textContent)
      .toBe('📝 連続ログ記録：3日');
  });

  test('render: 最後に吸った時刻がある場合 since が表示される', () => {
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 1,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: new Date(2026, 1, 1, 9, 5),
      minutesFromLastSmoke: 90,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('since').textContent)
      .toContain('禁煙中：09時05分から 90分経過');
  });

  test('render: 昨日との差分が表示される（増加/減少/同じ/未記録）', () => {
    const base = {
      todayKey: '2026-02-01',
      todayCount: 3,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
      consecutiveNoSmokeDays: 0,
    };

    window.mainView.render({ ...base, yesterdayCount: null });
    expect(document.getElementById('yesterdayDiff').textContent)
      .toBe('昨日の記録なし');

    window.mainView.render({ ...base, yesterdayCount: 1 });
    expect(document.getElementById('yesterdayDiff').textContent)
      .toBe('昨日より +2本');

    window.mainView.render({ ...base, yesterdayCount: 5 });
    expect(document.getElementById('yesterdayDiff').textContent)
      .toBe('昨日より -2本');

    window.mainView.render({ ...base, yesterdayCount: 3 });
    expect(document.getElementById('yesterdayDiff').textContent)
      .toBe('昨日と同じ');
  });

  test('render: 目標超過時はプログレスバーが黄色になる', () => {
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 12,
      yesterdayCount: 10,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    const progress = document.getElementById('progress');
    expect(progress.classList.contains('progress-yellow')).toBe(true);
  });

  test('render: 今日はまだ吸っていない場合 since の文言が固定文になる', () => {
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 0,
      consecutiveNoSmokeDays: 2,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('since').textContent)
      .toBe('禁煙中（今日はまだ吸っていません）');

    expect(document.getElementById('undoSmokeWrap').style.display)
      .toBe('none');
  });

  test('render: 昨日のログキーが未存在のときだけ「昨日は禁煙成功」を表示する', () => {
    window.logModel.getLogs.mockReturnValue({
      '2026-02-01': ['2026-02-01T09:05:00'],
    });
    const ctx = {
      todayKey: '2026-02-01',
      todayCount: 0,
      consecutiveNoSmokeDays: 0,
      lastSmokeAt: null,
      minutesFromLastSmoke: null,
    };

    window.mainView.render(ctx);

    expect(document.getElementById('yesterdaySuccessWrap').style.display)
      .toBe('block');

    window.logModel.getLogs.mockReturnValue({
      '2026-01-31': [],
    });
    window.mainView.render(ctx);

    expect(document.getElementById('yesterdaySuccessWrap').style.display)
      .toBe('none');
  });
});

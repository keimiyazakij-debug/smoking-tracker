/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('mainController', () => {
  let logs;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <button id="smokeBtn"></button>
      <div id="smokeHelp"></div>
      <div id="todayCountDisplay"></div>
      <button id="undoSmokeBtn"></button>
      <div id="yesterdaySuccessWrap"></div>
      <button id="yesterdaySuccessBtn"></button>
      <button id="todayTimelineLink"></button>
      <button id="gameChallengeLink"></button>
      <button id="gameBadgeLink"></button>
      <button id="badgeBackBtn"></button>
    `;

    logs = { '2026-02-01': [] };

    window.common = {
      getDateKey: jest.fn(() => '2026-02-01'),
    };

    window.settingModel = {
      loadSettings: jest.fn(() => ({ dailyTarget: 10 })),
    };

    window.logModel = {
      addSmoke: jest.fn(() => {
        logs['2026-02-01'].push(new Date());
      }),
      getLogs: jest.fn(() => logs),
      removeLastSmoke: jest.fn(() => true),
      setLogs: jest.fn((nextLogs) => {
        logs = nextLogs;
      }),
    };

    window.onLogChanged = jest.fn();
    window.dailyTaskController = { openToday: jest.fn() };
    window.timelineController = { openTimeline: jest.fn() };
    window.showTab = jest.fn();

    loadBrowserScript('../app/controller/mainController.js', {
      common: window.common,
      settingModel: window.settingModel,
      logModel: window.logModel,
      onLogChanged: window.onLogChanged,
      dailyTaskController: window.dailyTaskController,
      timelineController: window.timelineController,
      showTab: window.showTab,
    });

    window.mainController.initMain();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('吸った: 目標未満メッセージが表示される', () => {
    document.getElementById('smokeBtn').click();

    const msg = document.getElementById('smokeHelp').textContent;
    expect([
      '目標以内です。いい流れです。',
      '今日もコントロールできています。',
      '順調です。このままいきましょう。'
    ]).toContain(msg);
  });

  test('吸った: 目標ちょうどメッセージが表示される', () => {
    logs['2026-02-01'] = Array.from({ length: 9 }, () => new Date());

    document.getElementById('smokeBtn').click();

    const msg = document.getElementById('smokeHelp').textContent;
    expect([
      '目標ラインです。ここからが大事。',
      '今日はここで止められると最高です。',
      'あと少し、整えていきましょう。'
    ]).toContain(msg);
  });

  test('吸った: 目標超過メッセージが表示される', () => {
    logs['2026-02-01'] = Array.from({ length: 10 }, () => new Date());

    document.getElementById('smokeBtn').click();

    const msg = document.getElementById('smokeHelp').textContent;
    expect([
      '記録できたことが前進です。',
      '大丈夫、また整えていきましょう。',
      '続けていること自体が大切です。'
    ]).toContain(msg);
  });

  test('吸った: 連打防止で300msは無効化される', () => {
    const btn = document.getElementById('smokeBtn');
    btn.click();
    btn.click();

    expect(window.logModel.addSmoke).toHaveBeenCalledTimes(1);
    expect(btn.disabled).toBe(true);

    jest.advanceTimersByTime(300);
    expect(btn.disabled).toBe(false);
    btn.click();

    expect(window.logModel.addSmoke).toHaveBeenCalledTimes(2);
    expect(btn.disabled).toBe(true);
  });

  test('吸った: 今日の本数にパルスが付与される', () => {
    document.getElementById('smokeBtn').click();
    const el = document.getElementById('todayCountDisplay');
    expect(el.classList.contains('count-pulse')).toBe(true);
  });

  test('吸った: メッセージは自動で消えない', () => {
    document.getElementById('smokeBtn').click();
    const first = document.getElementById('smokeHelp').textContent;
    jest.advanceTimersByTime(5000);

    expect(document.getElementById('smokeHelp').textContent)
      .toBe(first);
  });

  test('吸った: window.onLogChanged 未定義でも例外にならない', () => {
    window.onLogChanged = undefined;

    expect(() => {
      document.getElementById('smokeBtn').click();
    }).not.toThrow();

    expect(window.logModel.addSmoke).toHaveBeenCalledTimes(1);
  });

  test('ゲーミフィケーション導線: クリックで dailyTaskController.openToday が呼ばれる', () => {
    document.getElementById('gameChallengeLink').click();
    expect(window.dailyTaskController.openToday).toHaveBeenCalledTimes(1);
  });

  test('今日のタイムラインリンク: 今日キーで openTimeline を呼ぶ', () => {
    document.getElementById('todayTimelineLink').click();
    expect(window.timelineController.openTimeline).toHaveBeenCalledWith('2026-02-01', {
      from: 'home',
      sourceDateKey: '2026-02-01'
    });
  });

  test('バッジリンク: gameBadges へ遷移する', () => {
    document.getElementById('gameBadgeLink').click();
    expect(window.showTab).toHaveBeenCalledWith('gameBadges');
  });

  test('バッジ戻る: game へ遷移する', () => {
    document.getElementById('badgeBackBtn').click();
    expect(window.showTab).toHaveBeenCalledWith('game');
  });

  test('UNDO: removeLastSmoke が true のとき onLogChanged を呼ぶ', () => {
    document.getElementById('undoSmokeBtn').click();
    expect(window.logModel.removeLastSmoke).toHaveBeenCalledWith('2026-02-01');
    expect(window.onLogChanged).toHaveBeenCalledTimes(1);
  });

  test('UNDO: removeLastSmoke が false のとき onLogChanged を呼ばない', () => {
    window.logModel.removeLastSmoke.mockReturnValue(false);
    document.getElementById('undoSmokeBtn').click();
    expect(window.onLogChanged).not.toHaveBeenCalled();
  });

  test('addSmoke: smokeBtn が存在しない場合は何もしない', () => {
    document.getElementById('smokeBtn').remove();
    expect(() => window.addSmoke()).not.toThrow();
    expect(window.logModel.addSmoke).not.toHaveBeenCalled();
  });

  test('昨日は禁煙成功: 前日キーを空配列で保存する', () => {
    window.common.getDateKey.mockReturnValue('2026-02-01');

    document.getElementById('yesterdaySuccessBtn').click();

    expect(window.logModel.setLogs).toHaveBeenCalledTimes(1);
    expect(logs['2026-02-01']).toEqual([]);
    expect(window.onLogChanged).toHaveBeenCalledWith('2026-02-01');
  });
});

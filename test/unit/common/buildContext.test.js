/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

// beforeAll or beforeEach で読み込む
beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('buildContext', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('今日・昨日・最終喫煙時刻・分差が正しく構築される', () => {
    // 現在時刻を固定
    const now = new Date('2026-01-02T10:00:00+09:00');

    // ログを事前に投入
    const logs = {
      '2026-01-01': [
        '2026-01-01T08:00:00+09:00'
      ],
      '2026-01-02': [
        '2026-01-02T09:30:00+09:00'
      ]
    };
    localStorage.setItem('dailyLogs', JSON.stringify(logs));

    const ctx = window.common.buildContext({
      now,
      logs,
      settings: { dailyTarget: 3 }
    });

    // 日付系
    expect(ctx.todayKey).toBe('2026-01-02');
    expect(ctx.todayCount).toBe(1);
    expect(ctx.yesterdayCount).toBe(1);

    // 最終喫煙
    expect(ctx.lastSmokeAt).not.toBeNull();
    expect(typeof ctx.lastSmokeAt.getTime).toBe('function');

    expect(ctx.lastSmokeAt.toISOString())
      .toBe(new Date('2026-01-02T09:30:00+09:00').toISOString());

    // 分差（10:00 - 9:30 = 30分）
    expect(ctx.minutesFromLastSmoke).toBe(30);

    // 状態フラグ
    expect(ctx.openedToday).toBe(true);
    expect(ctx.hasRecordToday).toBe(true);
    expect(ctx.badgesEarnedToday).toEqual([]);
  });

  test('ログが存在しない場合の初期状態', () => {
    const now = new Date('2026-01-02T10:00:00+09:00');

    const ctx = window.common.buildContext({
      now,
      logs: {},               // ← 明示的に空
      settings: { dailyTarget: 3 }
    });
    
    expect(ctx.todayCount).toBe(0);
    expect(ctx.yesterdayCount).toBeNull();
    expect(ctx.lastSmokeAt).toBeNull();
    expect(ctx.minutesFromLastSmoke).toBeNull();
    expect(ctx.hasRecordToday).toBe(false);
  });

  test('consecutiveNoSmokeDays: 連続禁煙日数が算出される', () => {
    const now = new Date('2026-01-05T10:00:00+09:00');
    const logs = {
      '2026-01-03': ['2026-01-03T09:00:00+09:00'],
      '2026-01-04': [],
      '2026-01-05': []
    };

    const ctx = window.common.buildContext({
      now,
      logs,
      settings: { dailyTarget: 3 },
      dateKey: '2026-01-05'
    });

    // 1/5, 1/4 が禁煙、1/3 は喫煙あり → 2日
    expect(ctx.consecutiveNoSmokeDays).toBe(2);
  });

  test('consecutiveNoSmokeDays: ログが空なら0', () => {
    const now = new Date('2026-01-05T10:00:00+09:00');
    const ctx = window.common.buildContext({
      now,
      logs: {},
      settings: { dailyTarget: 3 },
      dateKey: '2026-01-05'
    });

    expect(ctx.consecutiveNoSmokeDays).toBe(0);
  });

});

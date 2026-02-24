/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

function baseBadgeCtx() {
  return {
    minutesFromLastSmoke: 0,
    consecutiveNoSmokeDays: 0,
    dailyStreak: 0,
    dailyTotal: 0,
    goalStreak: 0,
    goalTotal: 0,
    downStreak: 0,
    downTotal: 0,
    todayCount: 0,
    countBetween: () => 0,
  };
}

function metricByCategory(category) {
  const map = {
    time: 'minutesFromLastSmoke',
    nosmoke: 'consecutiveNoSmokeDays',
    daily_streak: 'dailyStreak',
    daily_hist: 'dailyTotal',
    goal_streak: 'goalStreak',
    goal_total: 'goalTotal',
    down_streak: 'downStreak',
    down_total: 'downTotal',
  };
  return map[category];
}

function detectThreshold(badge, metricKey) {
  for (let n = 0; n <= 5000; n += 1) {
    const ctx = baseBadgeCtx();
    ctx[metricKey] = n;
    if (badge.check(ctx) === true) return n;
  }
  return null;
}

describe('constant.js BADGES definition coverage', () => {
  beforeAll(() => {
    loadBrowserScript('../app/common/constant.js');
  });

  test('BADGES が定義され、id 重複がない', () => {
    expect(Array.isArray(window.BADGES)).toBe(true);
    expect(window.BADGES.length).toBeGreaterThan(0);
    const ids = window.BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('全 badge 条件で false/true 両経路を通る', () => {
    window.BADGES.forEach((badge) => {
      expect(typeof badge.check).toBe('function');

      if (badge.category === 'timeband') {
        const falseCtx = baseBadgeCtx();
        falseCtx.countBetween = () => 1;
        const trueCtx = baseBadgeCtx();
        trueCtx.countBetween = () => 0;
        expect(badge.check(falseCtx)).toBe(false);
        expect(badge.check(trueCtx)).toBe(true);
        return;
      }

      if (badge.category === 'nosmoke_day') {
        const falseCtx = baseBadgeCtx();
        falseCtx.todayCount = 1;
        const trueCtx = baseBadgeCtx();
        trueCtx.todayCount = 0;
        expect(badge.check(falseCtx)).toBe(false);
        expect(badge.check(trueCtx)).toBe(true);
        return;
      }

      const metricKey = metricByCategory(badge.category);
      expect(metricKey).toBeTruthy();

      const threshold = detectThreshold(badge, metricKey);
      expect(threshold).not.toBeNull();

      const belowCtx = baseBadgeCtx();
      belowCtx[metricKey] = Math.max(0, threshold - 1);
      const atCtx = baseBadgeCtx();
      atCtx[metricKey] = threshold;

      if (threshold > 0) {
        expect(badge.check(belowCtx)).toBe(false);
      }
      expect(badge.check(atCtx)).toBe(true);
    });
  });
});

describe('constant.js DAILY_TASKS definition coverage', () => {
  beforeAll(() => {
    loadBrowserScript('../app/common/constant.js');
    loadBrowserScript('../app/model/dailyTaskModel.js');
  });

  function runTask(task, ctx) {
    const original = window.DAILY_TASKS;
    window.DAILY_TASKS = [task];
    const result = window.dailyTaskModel.evaluateTasks(ctx)[0];
    window.DAILY_TASKS = original;
    return result;
  }

  test('DAILY_TASKS が定義され、id 重複がない', () => {
    expect(Array.isArray(window.DAILY_TASKS)).toBe(true);
    expect(window.DAILY_TASKS.length).toBeGreaterThan(0);
    const ids = window.DAILY_TASKS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('全 task で rule ごとの判定が実行される', () => {
    window.DAILY_TASKS.forEach((task) => {
      expect(task).toBeTruthy();
      expect(typeof task.rule).toBe('string');

      if (task.rule === 'record') {
        const done = runTask(task, {
          todayKey: '2026-02-01',
          hasRecordToday: true,
          isToday: true,
          nowHour: 12,
          countBetween: () => 0,
        });
        const notDone = runTask(task, {
          todayKey: '2026-02-01',
          hasRecordToday: false,
          isToday: true,
          nowHour: 12,
          countBetween: () => 0,
        });
        expect(done.done).toBe(true);
        expect(notDone.done).toBe(false);
        return;
      }

      if (task.rule === 'timeband') {
        const done = runTask(task, {
          todayKey: '2026-02-01',
          hasRecordToday: false,
          isToday: true,
          nowHour: task.to,
          countBetween: () => 0,
        });
        const smoked = runTask(task, {
          todayKey: '2026-02-01',
          hasRecordToday: false,
          isToday: true,
          nowHour: task.to,
          countBetween: () => 1,
        });
        const notFinished = runTask(task, {
          todayKey: '2026-02-01',
          hasRecordToday: false,
          isToday: true,
          nowHour: Math.max(0, task.to - 1),
          countBetween: () => 0,
        });

        expect(done.done).toBe(true);
        expect(smoked.done).toBe(false);
        expect(notFinished.done).toBe(false);
        return;
      }

      throw new Error(`Unsupported task rule: ${task.rule}`);
    });
  });
});

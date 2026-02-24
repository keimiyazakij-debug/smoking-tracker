/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('calculateStats', () => {

  const settings = { dailyTarget: 3 };

  test('基本的な streak / total が計算される（今日を含まない）', () => {
    const DAY1 = window.common.getDateKey(new Date());
    const DAY2 = window.common.getDateKey(new Date(Date.now() - (24 * 60 * 60 * 1000)));
    const DAY3 = window.common.getDateKey(new Date(Date.now() - (48 * 60 * 60 * 1000)));
    const DAY4 = window.common.getDateKey(new Date(Date.now() - (72 * 60 * 60 * 1000)));
    const DAY5 = window.common.getDateKey(new Date(Date.now() - (96 * 60 * 60 * 1000)));

    const logs = {
      [DAY5]: ['a','b','c','d','e'], // 5本
      [DAY4]: ['a','b','c','d'],     // 4本
      [DAY3]: ['a','b','c'],         // 3本
      [DAY2]: ['a','b'],             // 2本
      [DAY1]: []                     // 0本
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.dailyTotal).toBe(5);
    expect(s.goalTotal).toBe(2);
    expect(s.downTotal).toBe(3);

    expect(s.dailyStreak).toBe(5);
    expect(s.goalStreak).toBe(2);
    expect(s.downStreak).toBe(3);

    expect(s.dailyStreakMax).toBe(5);
    expect(s.goalStreakMax).toBe(2);
    expect(s.downStreakMax).toBe(3);

  });

  test('基本的な streak / total が計算される（今日を含む）', () => {
    const DAY1 = window.common.getDateKey(new Date());
    const DAY2 = window.common.getDateKey(new Date(Date.now() - (24 * 60 * 60 * 1000)));
    const DAY3 = window.common.getDateKey(new Date(Date.now() - (48 * 60 * 60 * 1000)));
    const DAY4 = window.common.getDateKey(new Date(Date.now() - (72 * 60 * 60 * 1000)));

    const logs = {
      [DAY4]: ['a','b','c','d'], // 4本
      [DAY3]: ['a','b','c'],     // 3本
      [DAY2]: ['a','b'],         // 2本
      [DAY1]: ['a']              // 1本
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.dailyTotal).toBe(4);
    expect(s.goalTotal).toBe(2);
    expect(s.downTotal).toBe(2);

    expect(s.dailyStreak).toBe(4);
    expect(s.goalStreak).toBe(2);
    expect(s.downStreak).toBe(2);

    expect(s.dailyStreakMax).toBe(4);
    expect(s.goalStreakMax).toBe(2);
    expect(s.downStreakMax).toBe(2);

  });

});

describe('calculateStats 追加不足ケース（goalStreak / downStreak）', () => {

  const settings = { dailyTarget: 5 };
  const day = (offset) =>
    window.common.getDateKey(new Date(Date.now() - offset * 24 * 60 * 60 * 1000));

  // ====================
  // goalStreak（目標本数以内の連続）
  // ====================

  test('途中で1日だけ目標超過すると goalStreak は 0 になる', () => {
    const logs = {
      [day(2)]: ['a','b','c'],                 // 3本（達成）
      [day(1)]: ['a','b','c','d','e','f'],     // 6本（超過）
      [day(0)]: ['a'],
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.goalStreak).toBe(0);
  });

  test('目標超過の翌日に目標以内なら goalStreak は 1 になる（過去日）', () => {

    const logs = {
      [day(2)]: ['a','b','c','d','e','f'], // 6本（超過）
      [day(1)]: ['a','b','c'],             // 3本（達成）
      [day(0)]: ['a'],
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.goalStreak).toBe(1);
  });

  test('目標本数ちょうどは goalStreak 継続扱い', () => {
    const logs = {
      [day(2)]: ['a','b','c','d','e'], // 5本
      [day(1)]: ['a','b','c','d','e'], // 5本
      [day(0)]: ['a'],
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.goalStreak).toBe(2);
  });

  // ====================
  // downStreak（前日比マイナスの連続）
  // ====================

  test('前日より本数が減れば downStreak は 1 になる', () => {
    const logs = {
      [day(2)]: ['a','b','c','d','e'], // 5本
      [day(1)]: ['a','b','c'],         // 3本（減少）
      [day(0)]: ['a'],
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.downStreak).toBe(1);
  });

  test('前日より本数が増えたら downStreak は 0 にリセットされる', () => {
    const logs = {
      [day(2)]: ['a','b','c'],           // 3本
      [day(1)]: ['a','b','c','d','e'],   // 5本（増加）
      [day(0)]: ['a'],
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.downStreak).toBe(0);
  });

  test('減少が連続していれば downStreak は日数分になる', () => {

    const logs = {
      [day(3)]: ['a','b','c','d','e'], // 5本
      [day(2)]: ['a','b','c','d'],     // 4本
      [day(1)]: ['a','b','c'],         // 3本
      [day(0)]: ['a'],                 // 1本
    };

    const days = window.common.groupLogsByDate(logs);
    const s = window.common.calculateStats(days, settings);

    expect(s.downStreak).toBe(2);
  });

});

/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('badgeModel.evaluateBadges', () => {

  beforeAll(() => {
    // common / badgeEvaluator 本体
    loadBrowserScript('../app/common/common.js');
    loadBrowserScript('../app/model/badgeModel.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    window.BADGES = [
      {
        id: 'daily_3',
        label: '3 days streak',
        check: (ctx) => ctx.dailyStreak >= 3,
      },
      {
        id: 'down_10',
        label: '10 downs',
        check: (ctx) => ctx.downTotal >= 10,
      },
    ];    

    // バッジ付与Viewのモック
    window.badgeView = {
      grant: jest.fn(),
    };

  });

  function stats(overrides = {}) {
    return Object.assign({
      dailyStreak: 0,
      goalStreak: 0,
      downStreak: 0,
      downTotal: 0,
      smokeFreeHours: 0,
    }, overrides);
  }

  // ====================
  // 境界値
  // ====================
  test('dailyStreak が閾値ちょうどでバッジ付与', () => {
    const events = window.badgeModel.evaluateBadges(
      stats({ dailyStreak: 3 })
    );

    expect(events.length).toBe(1);
    expect(events[0].id).toBe('daily_3'); 
  });

  test('dailyStreak が閾値未満では付与されない', () => {
    window.badgeModel.evaluateBadges(
      stats({ dailyStreak: 2 })
    );

    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

  // ====================
  // 初回のみ付与
  // ====================
  test('同一条件で再評価しても再付与されない', () => {
    // 既に取得済みの状態を作る
    localStorage.setItem('badgeDone', JSON.stringify({
      daily_3: { earnedAt: '2026-01-01' }
    }));

    const events = window.badgeModel.evaluateBadges(
      { dailyStreak: 3 }
    );

    expect(events.length).toBe(0);
  });

  // ====================
  // 複数条件
  // ====================
  test('複数条件を満たした場合、複数バッジが評価される', () => {
    const events = window.badgeModel.evaluateBadges({
      dailyStreak: 3,
      downTotal: 10,
    });

    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  // ====================
  // 異常系
  // ====================
  test('stats が null でも例外にならない', () => {
    expect(() => {
      window.badgeModel.evaluateBadges(null);
    }).not.toThrow();

    expect(window.badgeView.grant).not.toHaveBeenCalled();
  });

});

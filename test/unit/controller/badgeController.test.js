/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  // common（不要なら省略可）
  loadBrowserScript('../app/common/common.js');

  // 対象
  loadBrowserScript('../app/controller/badgeController.js');

  // ===== 最小モック =====
  window.badgeModel = {
    evaluateBadges: jest.fn(),
    loadEarnedBadges: jest.fn()
  };

  window.badgeView = {
    grant: jest.fn(),
    render: jest.fn()
  };
});

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('badgeController.updateBadges', () => {

  test('新規バッジ取得時、evaluateBadges が呼ばれ UI が更新される', () => {
    const ctx = { badgesEarnedToday: [] };

    const events = [
      { type: 'badge', id: 'daily_7', label: '7日連続' }
    ];

    window.badgeModel.evaluateBadges.mockReturnValue(events);
    window.badgeModel.loadEarnedBadges.mockReturnValue({
      daily_7: { earnedAt: '2026-01-20' }
    });

    const result = window.badgeController.updateBadges(ctx);

    expect(ctx.badgesEarnedToday)
      .toEqual(['daily_7']);

    expect(window.badgeView.render)
      .toHaveBeenCalledWith({
        daily_7: { earnedAt: '2026-01-20' }
      });

    expect(result).toEqual(events);
  });

  test('新規取得がない場合、UI 更新は行われない', () => {
    const ctx = {};

    window.badgeModel.evaluateBadges.mockReturnValue([]);

    const result = window.badgeController.updateBadges(ctx);

    expect(window.badgeView.render).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

});

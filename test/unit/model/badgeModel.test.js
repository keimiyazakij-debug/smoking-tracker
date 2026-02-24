/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');

  // BADGES を最小限定義
  window.BADGES = [
    {
      id: 'TEST_BADGE',
      label: 'テスト',
      check: () => true
    }
  ];

  loadBrowserScript('../app/model/badgeModel.js');
});

describe('badgeModel.evaluateBadges (smoke test)', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('条件を満たすと badge イベントを返す', () => {
    const events = window.badgeModel.evaluateBadges({});

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('badge');
  });

  test('同じバッジは二度発火しない', () => {
    window.badgeModel.evaluateBadges({});
    const second = window.badgeModel.evaluateBadges({});

    expect(second.length).toBe(0);
  });

});

/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('common.isDateLocked', () => {
  beforeAll(() => {
    loadBrowserScript('../app/common/common.js', {
      location: { hostname: 'localhost' },
    });
  });

  test('無料版では60日より前がロックされる', () => {
    window.setIsPremium(false);
    const today = new Date();
    const old = new Date(today);
    old.setDate(today.getDate() - 61);
    const unlocked = new Date(today);
    unlocked.setDate(today.getDate() - 60);

    expect(window.common.isDateLocked(window.common.getDateKey(old))).toBe(true);
    expect(window.common.isDateLocked(window.common.getDateKey(unlocked))).toBe(false);
  });

  test('プレミアムではロックされない', () => {
    window.setIsPremium(true);
    const old = new Date();
    old.setDate(old.getDate() - 365);

    expect(window.common.isDateLocked(window.common.getDateKey(old))).toBe(false);
  });
});

/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('formatDate', () => {

  test('Date → YYYY-MM-DD', () => {
    const d = new Date('2026-01-02T12:00:00+09:00');
    expect(window.common.formatDate(d)).toBe('2026-01-02');
  });

});

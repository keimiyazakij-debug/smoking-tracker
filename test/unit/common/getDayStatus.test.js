/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
});

describe('common.getDayStatus', () => {
  test('A: undefined は unrecorded', () => {
    const logs = {};
    expect(window.common.getDayStatus('2026-02-10', logs)).toBe('unrecorded');
  });

  test('B: 空配列は success', () => {
    const logs = { '2026-02-10': [] };
    expect(window.common.getDayStatus('2026-02-10', logs)).toBe('success');
  });

  test('C: 配列要素ありは smoke', () => {
    const logs = { '2026-02-10': ['2026-02-10T10:00:00.000Z'] };
    expect(window.common.getDayStatus('2026-02-10', logs)).toBe('smoke');
  });
});

import { describe, expect, test } from 'vitest';
import { addSmoke, markSuccess, undoLastSmoke, type Logs } from '../../../src/domain/logs';

describe('domain/logs', () => {
  test('addSmoke は対象日のログへISO時刻を追加する', () => {
    const logs: Logs = {};
    const at = new Date('2026-02-01T10:00:00.000Z');
    const next = addSmoke(logs, at);

    expect(next['2026-02-01']).toEqual([at.toISOString()]);
    expect(logs['2026-02-01']).toBeUndefined();
  });

  test('undoLastSmoke は末尾1件を削除し、空ならキーごと削除する', () => {
    const logs: Logs = { '2026-02-01': ['a'] };
    const next = undoLastSmoke(logs, '2026-02-01');
    expect(next['2026-02-01']).toBeUndefined();
  });

  test('markSuccess は対象日を空配列で確定する', () => {
    const logs: Logs = { '2026-02-01': ['x'] };
    const next = markSuccess(logs, '2026-02-01');
    expect(next['2026-02-01']).toEqual([]);
    expect(logs['2026-02-01']).toEqual(['x']);
  });
});

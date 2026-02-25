import { describe, expect, test } from 'vitest';
import { buildInitialLogsState, logsReducer, type LogsState } from '../../../src/state/logs/logsReducer';

function makeState(): LogsState {
  return buildInitialLogsState();
}

describe('state/logs/logsReducer', () => {
  test('ADD_SMOKE で対象日にログが追加される', () => {
    const state = makeState();
    const next = logsReducer(state, { type: 'ADD_SMOKE', atISO: '2026-02-01T10:00:00.000Z' });
    expect(next.logs['2026-02-01']).toHaveLength(1);
  });

  test('UNDO_LAST_SMOKE は末尾を削除し、空ならキーを削除する', () => {
    const state: LogsState = {
      ...makeState(),
      logs: { '2026-02-01': ['a'] },
    };
    const next = logsReducer(state, { type: 'UNDO_LAST_SMOKE', dateKey: '2026-02-01' });
    expect(next.logs['2026-02-01']).toBeUndefined();
  });

  test('MARK_SUCCESS は空配列ログを作成する', () => {
    const state = makeState();
    const next = logsReducer(state, { type: 'MARK_SUCCESS', dateKey: '2026-02-01' });
    expect(next.logs['2026-02-01']).toEqual([]);
  });

  test('SET_LOGS は値を置き換える', () => {
    const state = makeState();
    const next = logsReducer(state, { type: 'SET_LOGS', logs: { '2026-02-01': ['x'] } });
    expect(next.logs).toEqual({ '2026-02-01': ['x'] });
  });

  test('SET_MEMO は空文字で削除される', () => {
    const state: LogsState = {
      ...makeState(),
      memos: { '2026-02-01': 'memo' },
    };
    const next = logsReducer(state, { type: 'SET_MEMO', dateKey: '2026-02-01', memo: '  ' });
    expect(next.memos['2026-02-01']).toBeUndefined();
  });
});

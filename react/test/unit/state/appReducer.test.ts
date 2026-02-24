import { describe, expect, test } from 'vitest';
import { appReducer, buildInitialState, initialPersisted } from '../../../src/state/appReducer';
import type { AppState } from '../../../src/types/app';

function makeState(): AppState {
  return buildInitialState(initialPersisted);
}

describe('state/appReducer', () => {
  test('ADD_SMOKE で対象日にログが追加される', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'ADD_SMOKE', atISO: '2026-02-01T10:00:00.000Z' });
    expect(next.logs['2026-02-01']).toHaveLength(1);
  });

  test('UNDO_LAST_SMOKE は末尾を削除し、空ならキーを削除する', () => {
    const state: AppState = {
      ...makeState(),
      logs: { '2026-02-01': ['a'] },
    };
    const next = appReducer(state, { type: 'UNDO_LAST_SMOKE', dateKey: '2026-02-01' });
    expect(next.logs['2026-02-01']).toBeUndefined();
  });

  test('MARK_SUCCESS は空配列ログを作成する', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'MARK_SUCCESS', dateKey: '2026-02-01' });
    expect(next.logs['2026-02-01']).toEqual([]);
  });

  test('SET_DAILY_TARGET は0未満を0に丸める', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'SET_DAILY_TARGET', dailyTarget: -5 });
    expect(next.settings.dailyTarget).toBe(0);
  });

  test('SET_SLEEP_HOURS は睡眠時刻を更新する', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'SET_SLEEP_HOURS', sleepStart: '23:30', sleepEnd: '06:30' });
    expect(next.settings.sleepStart).toBe('23:30');
    expect(next.settings.sleepEnd).toBe('06:30');
  });

  test('SET_LOGS / SET_PREMIUM は値を置き換える', () => {
    const state = makeState();
    const withLogs = appReducer(state, { type: 'SET_LOGS', logs: { '2026-02-01': ['x'] } });
    const withPremium = appReducer(withLogs, { type: 'SET_PREMIUM', isPremium: true });
    expect(withLogs.logs).toEqual({ '2026-02-01': ['x'] });
    expect(withPremium.isPremium).toBe(true);
  });

  test('SET_MEMO は空文字で削除される', () => {
    const state: AppState = {
      ...makeState(),
      memos: { '2026-02-01': 'memo' },
    };
    const next = appReducer(state, { type: 'SET_MEMO', dateKey: '2026-02-01', memo: '  ' });
    expect(next.memos['2026-02-01']).toBeUndefined();
  });
});

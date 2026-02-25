import { describe, expect, test } from 'vitest';
import { buildInitialSettingsState, settingsReducer, type SettingsState } from '../../../src/state/settings/settingsReducer';

function makeState(): SettingsState {
  return buildInitialSettingsState();
}

describe('state/settings/settingsReducer', () => {
  test('SET_DAILY_TARGET は0未満を0に丸める', () => {
    const state = makeState();
    const next = settingsReducer(state, { type: 'SET_DAILY_TARGET', dailyTarget: -5 });
    expect(next.settings.dailyTarget).toBe(0);
  });

  test('SET_SLEEP_HOURS は睡眠時刻を更新する', () => {
    const state = makeState();
    const next = settingsReducer(state, { type: 'SET_SLEEP_HOURS', sleepStart: '23:30', sleepEnd: '06:30' });
    expect(next.settings.sleepStart).toBe('23:30');
    expect(next.settings.sleepEnd).toBe('06:30');
  });

  test('SET_PREMIUM は値を置き換える', () => {
    const state = makeState();
    const next = settingsReducer(state, { type: 'SET_PREMIUM', isPremium: true });
    expect(next.isPremium).toBe(true);
  });
});

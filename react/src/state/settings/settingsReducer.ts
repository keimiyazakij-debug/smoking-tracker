import type { Settings } from '../../types/app';

export type SettingsState = {
  settings: Settings;
  isPremium: boolean;
};

export type SettingsAction =
  | { type: 'SET_DAILY_TARGET'; dailyTarget: number }
  | { type: 'SET_SLEEP_HOURS'; sleepStart: string | null; sleepEnd: string | null }
  | { type: 'SET_PREMIUM'; isPremium: boolean };

export const DEFAULT_SETTINGS: Settings = {
  dailyTarget: 10,
  calendarEvaluation: 'target',
  sleepStart: null,
  sleepEnd: null,
};

export const initialSettingsState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  isPremium: false,
};

export function buildInitialSettingsState(input?: Partial<SettingsState> | null): SettingsState {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...(input?.settings ?? {}),
    },
    isPremium: input?.isPremium ?? false,
  };
}

export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_DAILY_TARGET':
      return {
        ...state,
        settings: {
          ...state.settings,
          dailyTarget: Math.max(0, action.dailyTarget),
        },
      };

    case 'SET_SLEEP_HOURS':
      return {
        ...state,
        settings: {
          ...state.settings,
          sleepStart: action.sleepStart,
          sleepEnd: action.sleepEnd,
        },
      };

    case 'SET_PREMIUM':
      return { ...state, isPremium: action.isPremium };

    default:
      return state;
  }
}

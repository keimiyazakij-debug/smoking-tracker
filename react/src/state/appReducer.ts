import { getDateKey } from '../domain/date';
import { addSmoke, markSuccess, undoLastSmoke } from '../domain/logs';
import type { AppAction, AppState, PersistedState, Settings } from '../types/app';

export const DEFAULT_SETTINGS: Settings = {
  dailyTarget: 10,
  calendarEvaluation: 'target',
  sleepStart: null,
  sleepEnd: null,
};

export const initialPersisted: PersistedState = {
  logs: {},
  settings: DEFAULT_SETTINGS,
  memos: {},
  isPremium: false,
};

export function buildInitialState(persisted: PersistedState): AppState {
  return {
    ...persisted,
    settings: { ...DEFAULT_SETTINGS, ...persisted.settings },
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_SMOKE': {
      const at = action.atISO ? new Date(action.atISO) : new Date();
      return {
        ...state,
        logs: addSmoke(state.logs, at),
      };
    }

    case 'UNDO_LAST_SMOKE': {
      const dateKey = action.dateKey ?? getDateKey(new Date());
      return {
        ...state,
        logs: undoLastSmoke(state.logs, dateKey),
      };
    }

    case 'MARK_SUCCESS':
      return {
        ...state,
        logs: markSuccess(state.logs, action.dateKey),
      };

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

    case 'SET_LOGS':
      return { ...state, logs: action.logs };

    case 'SET_MEMO': {
      const text = action.memo.trim();
      const memos = { ...state.memos };
      if (!text) delete memos[action.dateKey];
      else memos[action.dateKey] = text;
      return { ...state, memos };
    }

    case 'SET_PREMIUM':
      return { ...state, isPremium: action.isPremium };

    default:
      return state;
  }
}

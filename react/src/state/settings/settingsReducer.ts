import type { Entitlement, PurchaseState, Settings } from '../../types/app';
import { resolveEntitlement, resolvePurchaseState } from './settingsSelectors';

export type SettingsState = {
  settings: Settings;
  entitlement: Entitlement;
  purchaseState: PurchaseState;
};

export type SettingsAction =
  | { type: 'SET_DAILY_TARGET'; dailyTarget: number }
  | { type: 'SET_SLEEP_HOURS'; sleepStart: string | null; sleepEnd: string | null }
  | { type: 'SET_ENTITLEMENT'; entitlement: Entitlement }
  | { type: 'SET_PURCHASE_STATE'; purchaseState: PurchaseState }
  | { type: 'SET_PREMIUM'; isPremium: boolean };

export const DEFAULT_SETTINGS: Settings = {
  dailyTarget: 10,
  calendarEvaluation: 'target',
  sleepStart: null,
  sleepEnd: null,
};

export const initialSettingsState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  entitlement: 'free',
  purchaseState: 'unknown',
};

export function buildInitialSettingsState(input?: (Partial<SettingsState> & { isPremium?: boolean }) | null): SettingsState {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...(input?.settings ?? {}),
    },
    entitlement: resolveEntitlement(input),
    purchaseState: resolvePurchaseState(input),
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

    case 'SET_ENTITLEMENT':
      return { ...state, entitlement: action.entitlement };

    case 'SET_PURCHASE_STATE':
      return { ...state, purchaseState: action.purchaseState };

    case 'SET_PREMIUM':
      return { ...state, entitlement: action.isPremium ? 'premium' : 'free' };

    default:
      return state;
  }
}

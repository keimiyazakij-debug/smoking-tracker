import { createContext, useContext, type Dispatch, type PropsWithChildren } from 'react';
import type { SettingsAction, SettingsState } from './settingsReducer';

type SettingsContextValue = {
  state: SettingsState;
  dispatch: Dispatch<SettingsAction>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  state,
  dispatch,
  children,
}: PropsWithChildren<{ state: SettingsState; dispatch: Dispatch<SettingsAction> }>) {
  return <SettingsContext.Provider value={{ state, dispatch }}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return ctx;
}

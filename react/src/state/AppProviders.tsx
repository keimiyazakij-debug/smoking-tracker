import { useEffect, useReducer, type PropsWithChildren } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { PersistedState } from '../types/app';
import { LogsProvider } from './logs/LogsContext';
import { buildInitialLogsState, initialLogsState, logsReducer } from './logs/logsReducer';
import { SettingsProvider } from './settings/SettingsContext';
import { buildInitialSettingsState, initialSettingsState, settingsReducer } from './settings/settingsReducer';
import { UIProvider } from './ui/UIContext';

const STORAGE_KEY = 'smoking_tracker_react_state';

const initialPersisted: PersistedState = {
  logs: initialLogsState.logs,
  memos: initialLogsState.memos,
  settings: initialSettingsState.settings,
  isPremium: initialSettingsState.isPremium,
};

export function AppProviders({ children }: PropsWithChildren) {
  const [persisted, setPersisted] = useLocalStorage<PersistedState>(STORAGE_KEY, initialPersisted);
  const [logsState, logsDispatch] = useReducer(logsReducer, persisted, (snapshot) =>
    buildInitialLogsState({
      logs: snapshot.logs,
      memos: snapshot.memos,
    }),
  );
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, persisted, (snapshot) =>
    buildInitialSettingsState({
      settings: snapshot.settings,
      isPremium: snapshot.isPremium,
    }),
  );

  useEffect(() => {
    setPersisted({
      logs: logsState.logs,
      memos: logsState.memos,
      settings: settingsState.settings,
      isPremium: settingsState.isPremium,
    });
  }, [logsState.logs, logsState.memos, settingsState.settings, settingsState.isPremium, setPersisted]);

  return (
    <LogsProvider state={logsState} dispatch={logsDispatch}>
      <SettingsProvider state={settingsState} dispatch={settingsDispatch}>
        <UIProvider>{children}</UIProvider>
      </SettingsProvider>
    </LogsProvider>
  );
}

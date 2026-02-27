import { useEffect, useMemo, useReducer, type PropsWithChildren } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { PersistedState } from '../types/app';
import { LogsProvider } from './logs/LogsContext';
import { buildInitialLogsState, initialLogsState, logsReducer } from './logs/logsReducer';
import { SettingsProvider } from './settings/SettingsContext';
import { buildInitialSettingsState, initialSettingsState, settingsReducer } from './settings/settingsReducer';
import { resolveEntitlement, resolvePurchaseState } from './settings/settingsSelectors';
import { UIProvider } from './ui/UIContext';

const STORAGE_KEY = 'smoking_tracker_react_state';

const initialPersisted: PersistedState = {
  logs: initialLogsState.logs,
  memos: initialLogsState.memos,
  settings: initialSettingsState.settings,
  entitlement: initialSettingsState.entitlement,
  purchaseState: initialSettingsState.purchaseState,
};

type LegacyPersisted = Partial<PersistedState> & { isPremium?: boolean };

function migratePersisted(snapshot: LegacyPersisted | null | undefined): PersistedState {
  return {
    logs: snapshot?.logs ?? initialLogsState.logs,
    memos: snapshot?.memos ?? initialLogsState.memos,
    settings: {
      ...initialSettingsState.settings,
      ...(snapshot?.settings ?? {}),
    },
    entitlement: resolveEntitlement(snapshot),
    purchaseState: resolvePurchaseState(snapshot),
  };
}

export function AppProviders({ children }: PropsWithChildren) {
  const [persisted, setPersisted] = useLocalStorage<LegacyPersisted>(STORAGE_KEY, initialPersisted);
  const migratedPersisted = useMemo(() => migratePersisted(persisted), [persisted]);

  const [logsState, logsDispatch] = useReducer(logsReducer, migratedPersisted, (snapshot) =>
    buildInitialLogsState({
      logs: snapshot.logs,
      memos: snapshot.memos,
    }),
  );
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, migratedPersisted, (snapshot) =>
    buildInitialSettingsState({
      settings: snapshot.settings,
      entitlement: snapshot.entitlement,
      purchaseState: snapshot.purchaseState,
    }),
  );

  useEffect(() => {
    setPersisted({
      logs: logsState.logs,
      memos: logsState.memos,
      settings: settingsState.settings,
      entitlement: settingsState.entitlement,
      purchaseState: settingsState.purchaseState,
    });
  }, [logsState.logs, logsState.memos, settingsState.settings, settingsState.entitlement, settingsState.purchaseState, setPersisted]);

  return (
    <LogsProvider state={logsState} dispatch={logsDispatch}>
      <SettingsProvider state={settingsState} dispatch={settingsDispatch}>
        <UIProvider>{children}</UIProvider>
      </SettingsProvider>
    </LogsProvider>
  );
}

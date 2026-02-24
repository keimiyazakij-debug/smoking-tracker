import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppAction, AppState, PersistedState } from '../types/app';
import { appReducer, buildInitialState, initialPersisted } from './appReducer';

type AppContextValue = {
  state: AppState;
  dispatch: Dispatch<AppAction>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [persisted, setPersisted] = useLocalStorage<PersistedState>('smoking_tracker_react_state', initialPersisted);
  const [state, dispatch] = useReducer(appReducer, persisted, buildInitialState);

  useEffect(() => {
    setPersisted({
      logs: state.logs,
      settings: state.settings,
      memos: state.memos,
      isPremium: state.isPremium,
    });
  }, [state.logs, state.settings, state.memos, state.isPremium, setPersisted]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}

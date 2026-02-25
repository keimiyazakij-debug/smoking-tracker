import { createContext, useContext, useMemo, useReducer, type Dispatch, type PropsWithChildren } from 'react';
import { initialUIState, type UIAction, type UIState, uiReducer } from './uiReducer';

type UIContextValue = {
  state: UIState;
  dispatch: Dispatch<UIAction>;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return ctx;
}

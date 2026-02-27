import { render } from '@testing-library/react';
import App from '../../src/App';
import type { PersistedState } from '../../src/types/app';

const defaultPersisted: PersistedState = {
  logs: {},
  settings: { dailyTarget: 10, calendarEvaluation: 'target' },
  memos: {},
  entitlement: 'free',
  purchaseState: 'unknown',
};

export function renderApp(options?: { path?: string; persisted?: Partial<PersistedState> }) {
  const path = options?.path ?? '/';
  const persisted = { ...defaultPersisted, ...(options?.persisted || {}) };

  window.history.pushState({}, '', '/');
  window.location.hash = `#${path}`;
  window.localStorage.setItem('smoking_tracker_react_state', JSON.stringify(persisted));

  return render(<App />);
}

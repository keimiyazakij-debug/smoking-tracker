import { render } from '@testing-library/react';
import App from '../../src/App';
import type { PersistedState } from '../../src/types/app';

const defaultPersisted: PersistedState = {
  logs: {},
  settings: { dailyTarget: 10, calendarEvaluation: 'target' },
  memos: {},
  isPremium: false,
};

export function renderApp(options?: { path?: string; persisted?: Partial<PersistedState> }) {
  const path = options?.path ?? '/main';
  const persisted = { ...defaultPersisted, ...(options?.persisted || {}) };

  window.history.pushState({}, '', path);
  window.localStorage.setItem('smoking_tracker_react_state', JSON.stringify(persisted));

  return render(<App />);
}

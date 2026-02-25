import { beforeEach, describe, expect, test } from 'vitest';
import { renderApp } from '../helpers/renderApp';

function currentHashPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

describe('integration/appInit', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('初期化時に永続化設定とログを読み込み表示する', () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          [todayKey]: [`${todayKey}T09:00:00`, `${todayKey}T12:00:00`],
        },
        settings: {
          dailyTarget: 7,
          calendarEvaluation: 'target',
        },
      },
    });

    expect(document.getElementById('todayCountDisplay')?.textContent).toBe('2');
    expect(document.getElementById('todayTargetDisplay')?.textContent).toBe('目標 7本');
  });

  test('URLパスに応じて対応タブで初期表示される', () => {
    renderApp({ path: '/settings' });
    expect(currentHashPath()).toBe('/settings');
    expect(document.getElementById('settings')).not.toBeNull();
    expect(document.querySelector('nav button[data-tab="/settings"]')?.getAttribute('aria-selected')).toBe('true');
  });
});

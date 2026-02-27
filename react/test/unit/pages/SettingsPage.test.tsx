import { beforeEach, describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, waitFor } from '@testing-library/react';
import { isDevModeEnabled } from '../../../src/pages/SettingsPage';
import App from '../../../src/App';
import { renderApp } from '../../helpers/renderApp';
import * as dataTransfer from '../../../src/platform/dataTransfer';

describe('SettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(dataTransfer, 'importTextFile').mockReset();
    vi.spyOn(dataTransfer, 'exportTextFile').mockReset();
    vi.spyOn(dataTransfer, 'isFilePickCancelled').mockReset();
    vi.mocked(dataTransfer.isFilePickCancelled).mockReturnValue(false);
  });

  test('目標本数変更がlocalStorageへ永続化される', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/settings' });

    const input = document.getElementById('dailyTarget') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '12');

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.settings?.dailyTarget).toBe(12);
    });
  });

  test('睡眠時刻の変更がlocalStorageへ永続化される', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/settings' });

    const sleepStartHour = document.getElementById('sleepStartHour') as HTMLSelectElement;
    const sleepStartMinute = document.getElementById('sleepStartMinute') as HTMLSelectElement;
    const sleepEndHour = document.getElementById('sleepEndHour') as HTMLSelectElement;
    const sleepEndMinute = document.getElementById('sleepEndMinute') as HTMLSelectElement;
    await user.selectOptions(sleepStartHour, '23');
    await user.selectOptions(sleepStartMinute, '30');
    await user.selectOptions(sleepEndHour, '06');
    await user.selectOptions(sleepEndMinute, '30');

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.settings?.sleepStart).toBe('23:30');
      expect(parsed?.settings?.sleepEnd).toBe('06:30');
    });
  });

  test('データインポートでログが置き換わる', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/settings',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T10:00:00`],
        },
      },
    });

    const importLogs = {
      '2026-02-01': ['2026-02-01T09:00:00', '2026-02-01T10:00:00'],
    };
    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(JSON.stringify({ logs: importLogs }));
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual(importLogs);
    });
    expect(document.querySelector('.settings-note')?.textContent).toContain('インポートが完了しました');
  });

  test('schemaVersion付きJSONをインポートできる', async () => {
    const user = userEvent.setup();
    renderApp({
      path: '/settings',
      persisted: { logs: {} },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: '2026-02-25T00:00:00.000Z',
        data: {
          logs: { '2026-02-05': ['2026-02-05T09:00:00'] },
          settings: { dailyTarget: 9, calendarEvaluation: 'target', sleepStart: '23:00', sleepEnd: '06:30' },
          memos: { '2026-02-05': 'new memo' },
          entitlement: 'premium',
          purchaseState: 'active',
        },
      }),
    );
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual({ '2026-02-05': ['2026-02-05T09:00:00'] });
      expect(parsed?.settings?.dailyTarget).toBe(9);
      expect(parsed?.settings?.sleepStart).toBe('23:00');
      expect(parsed?.settings?.sleepEnd).toBe('06:30');
      expect(parsed?.memos?.['2026-02-05']).toBe('new memo');
      expect(parsed?.entitlement).toBe('premium');
      expect(parsed?.purchaseState).toBe('active');
    });
  });

  test('旧形式JSON（schemaVersionなし）でもインポートできる', async () => {
    const user = userEvent.setup();
    renderApp({
      path: '/settings',
      persisted: { logs: {} },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(
      JSON.stringify({
        logs: { '2026-02-07': ['2026-02-07T08:00:00'] },
        settings: { dailyTarget: 11, calendarEvaluation: 'target', sleepStart: '23:30', sleepEnd: '07:00' },
        memos: { '2026-02-07': 'legacy format' },
        isPremium: false,
      }),
    );
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual({ '2026-02-07': ['2026-02-07T08:00:00'] });
      expect(parsed?.settings?.dailyTarget).toBe(11);
      expect(parsed?.memos?.['2026-02-07']).toBe('legacy format');
      expect(parsed?.entitlement).toBe('free');
      expect(parsed?.purchaseState).toBe('unknown');
    });
  });

  test('旧形式バックアップ（dailyLogs）でもインポートできる', async () => {
    const user = userEvent.setup();
    renderApp({
      path: '/settings',
      persisted: {
        logs: {
          '2026-02-10': ['2026-02-10T10:00:00'],
        },
      },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(
      JSON.stringify({
        dailyLogs: JSON.stringify({
          '2026-02-01': ['2026-02-01T09:00:00'],
        }),
      }),
    );
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual({
        '2026-02-01': ['2026-02-01T09:00:00'],
      });
    });
  });

  test('旧形式でmemosキー同居時もdailyLogsを取り込める', async () => {
    const user = userEvent.setup();
    renderApp({
      path: '/settings',
      persisted: { logs: {} },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(
      JSON.stringify({
        dailyLogs: JSON.stringify({ '2026-02-06': ['2026-02-06T05:09:49.285Z'] }),
        memos: '{}',
      }),
    );
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs?.['2026-02-06']).toEqual(['2026-02-06T05:09:49.285Z']);
    });
  });

  test('不正なJSONのインポートでは既存データが維持される', async () => {
    const user = userEvent.setup();
    const baseLogs = {
      '2026-02-03': ['2026-02-03T10:00:00'],
    };

    renderApp({
      path: '/settings',
      persisted: {
        logs: baseLogs,
      },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce('{invalid json');
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual(baseLogs);
    });
  });

  test('schemaVersionが不正な場合はインポート失敗になる', async () => {
    const user = userEvent.setup();
    const baseLogs = {
      '2026-02-08': ['2026-02-08T10:00:00'],
    };

    renderApp({
      path: '/settings',
      persisted: {
        logs: baseLogs,
      },
    });

    vi.mocked(dataTransfer.importTextFile).mockResolvedValueOnce(
      JSON.stringify({
        schemaVersion: '1',
        exportedAt: '2026-02-25T00:00:00.000Z',
        data: {
          logs: { '2026-02-09': ['2026-02-09T10:00:00'] },
          settings: { dailyTarget: 10, calendarEvaluation: 'target' },
        },
      }),
    );
    await user.click(document.getElementById('importDataBtn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual(baseLogs);
    });
    expect(document.querySelector('.settings-note')?.textContent).toContain('ファイル形式が正しくありません。');
  });

  test('全データをリセットでログが空になる', async () => {
    const user = userEvent.setup();
    renderApp({
      path: '/settings',
      persisted: {
        logs: {
          '2026-02-01': ['2026-02-01T09:00:00'],
        },
      },
    });

    await user.click(document.querySelector('.settings-danger-btn') as HTMLButtonElement);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual({});
    });
    expect(document.querySelector('.settings-note')?.textContent).toContain('全データをリセットしました');
  });

  test('データエクスポートでschemaVersion付きJSONを出力する', async () => {
    const user = userEvent.setup();
    vi.mocked(dataTransfer.exportTextFile).mockResolvedValueOnce();

    renderApp({ path: '/settings' });
    await user.click(document.getElementById('exportDataBtn') as HTMLButtonElement);

    expect(dataTransfer.exportTextFile).toHaveBeenCalledTimes(1);
    const [, jsonText] = vi.mocked(dataTransfer.exportTextFile).mock.calls[0] as [string, string];
    const parsed = JSON.parse(jsonText);
    expect(parsed?.schemaVersion).toBe(1);
    expect(typeof parsed?.exportedAt).toBe('string');
    expect(parsed?.data).toBeTruthy();
    expect(parsed?.data?.logs).toBeTruthy();
    expect(parsed?.data?.settings).toBeTruthy();
    expect(parsed?.data?.isPremium).toBeUndefined();
    expect(parsed?.data?.entitlement === 'free' || parsed?.data?.entitlement === 'premium').toBe(true);
    expect(parsed?.data?.purchaseState).toBe('unknown');
  });

  test('開発モードではプレミアム切り替えトグルが表示される', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/settings' });
    const toggle = document.getElementById('debugPremiumToggle') as HTMLInputElement | null;
    expect(toggle).not.toBeNull();
    await user.click(toggle!);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.entitlement).toBe('premium');
    });
  });

  test('localStorage旧形式isPremiumを起動時にentitlementへ移行する', async () => {
    window.localStorage.setItem(
      'smoking_tracker_react_state',
      JSON.stringify({
        logs: {},
        settings: { dailyTarget: 10, calendarEvaluation: 'target' },
        memos: {},
        isPremium: true,
      }),
    );

    window.history.pushState({}, '', '/');
    window.location.hash = '#/settings';
    render(<App />);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.isPremium).toBeUndefined();
      expect(parsed?.entitlement).toBe('premium');
      expect(parsed?.purchaseState).toBe('unknown');
    });
  });

  test('debug.github.io を含むホストは開発モード判定になる', () => {
    expect(isDevModeEnabled('keimiyazakij-debug.github.io', null)).toBe(true);
  });
});

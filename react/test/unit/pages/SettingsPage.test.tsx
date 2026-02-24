import { beforeEach, describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { renderApp } from '../../helpers/renderApp';

describe('SettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
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
    const file = new File([JSON.stringify({ logs: importLogs })], 'backup.json', { type: 'application/json' });
    const input = document.getElementById('importDataFile') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual(importLogs);
    });
    expect(document.querySelector('.settings-note')?.textContent).toContain('インポートが完了しました');
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

    const file = new File(
      [
        JSON.stringify({
          dailyLogs: JSON.stringify({
            '2026-02-01': ['2026-02-01T09:00:00'],
          }),
        }),
      ],
      'legacy-backup.json',
      { type: 'application/json' },
    );
    const input = document.getElementById('importDataFile') as HTMLInputElement;
    await user.upload(input, file);

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

    const file = new File(
      [
        JSON.stringify({
          dailyLogs: JSON.stringify({ '2026-02-06': ['2026-02-06T05:09:49.285Z'] }),
          memos: '{}',
        }),
      ],
      'legacy-mixed.json',
      { type: 'application/json' },
    );
    const input = document.getElementById('importDataFile') as HTMLInputElement;
    await user.upload(input, file);

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

    const file = new File(['{invalid json'], 'broken.json', { type: 'application/json' });
    const input = document.getElementById('importDataFile') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      const raw = window.localStorage.getItem('smoking_tracker_react_state');
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed?.logs).toEqual(baseLogs);
    });
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

  test('データエクスポートでBlob URL作成と解放が実行される', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderApp({ path: '/settings' });
    await user.click(document.getElementById('exportDataBtn') as HTMLButtonElement);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
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
      expect(parsed?.isPremium).toBe(true);
    });
  });
});

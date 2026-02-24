import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';

describe('MainPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('吸った→UNDOで本数が増減する', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/main' });

    expect(document.getElementById('todayCountDisplay')?.textContent).toBe('0');
    await user.click(screen.getByRole('button', { name: '吸った' }));
    expect(document.getElementById('todayCountDisplay')?.textContent).toBe('1');

    await user.click(screen.getByRole('button', { name: '直前の記録を戻す' }));
    expect(document.getElementById('todayCountDisplay')?.textContent).toBe('0');
  });

  test('昨日記録が無い場合は「昨日は禁煙成功」ボタンが表示され、押すと非表示になる', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;

    renderApp({ path: '/main' });

    const btn = document.getElementById('yesterdaySuccessBtn') as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await user.click(btn!);

    expect(document.getElementById('yesterdaySuccessWrap')?.getAttribute('style')).toContain('display: none');

    const raw = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.logs?.[yKey]).toEqual([]);
  });

  test('昨日に記録エントリがある場合は「昨日は禁煙成功」ボタンが表示されない', () => {
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          [yKey]: [`${yKey}T10:00:00`],
        },
      },
    });

    expect(document.getElementById('yesterdaySuccessWrap')?.getAttribute('style')).toContain('display: none');
  });

  test('喫煙間隔カードを表示し、自己ベストまで60分以内でメッセージを表示する', () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const earlier = new Date(now.getTime() - 180 * 60 * 1000);
    const latest = new Date(now.getTime() - 60 * 60 * 1000);

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          [todayKey]: [earlier.toISOString(), latest.toISOString()],
        },
      },
    });

    expect(document.getElementById('bestIntervalDisplay')?.textContent).toContain('2時間');
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toMatch(/あと\d+分で自己ベスト/);
    expect(document.getElementById('avg7Display')).toBeNull();
    expect(document.getElementById('since')).toBeNull();
  });

  test('自己ベスト更新時は更新メッセージを表示する', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T12:10:00');
    vi.setSystemTime(now);
    const todayKey = '2026-02-24';

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          [todayKey]: ['2026-02-24T08:00:00.000', '2026-02-24T10:00:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toContain('自己ベストを');
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toContain('更新しました');
  });

  test('自己ベスト更新メッセージは当日中に1分更新しても維持される', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T12:10:00');
    vi.setSystemTime(now);
    const todayKey = '2026-02-24';

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          [todayKey]: ['2026-02-24T08:00:00.000', '2026-02-24T10:00:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toContain('自己ベストを');

    await act(async () => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toContain('自己ベストを');
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toContain('更新しました');
  });

  test('今日の最長があっても自己ベスト条件に該当しない場合は通知しない', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T12:00:00');
    vi.setSystemTime(now);

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-23': ['2026-02-23T00:00:00.000', '2026-02-23T05:00:00.000'],
          '2026-02-24': ['2026-02-24T08:00:00.000', '2026-02-24T10:20:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(document.getElementById('todayLongestDisplay')?.textContent || '').not.toBe('');
    expect(document.getElementById('mainMessageBlock')?.textContent || '').toBe('');
  });
});

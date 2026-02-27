import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
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

  test('喫煙間隔カードを表示し、次の目標1行を表示する', () => {
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
    expect(screen.getByText(/(あと\d+:\d{2}で.+（\d+:\d{2}）更新|自己ベスト更新中！)/)).toBeInTheDocument();
    expect(document.getElementById('avg7Display')).toBeNull();
    expect(document.getElementById('since')).toBeNull();
  });

  test('自己ベスト更新時は成果ティッカーに★自己ベスト更新を表示する', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T23:00:00');
    vi.setSystemTime(now);
    const todayKey = '2026-02-24';

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-23': ['2026-02-23T12:00:00.000'],
          [todayKey]: ['2026-02-24T00:10:00.000', '2026-02-24T01:00:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    const achievementButton = screen.getByRole('button', { name: '今日の成果を表示' });
    expect(achievementButton.textContent || '').toContain('★ 自己ベスト更新');
  });

  test('自己ベスト更新成果は当日中の更新後も一覧に残る', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T23:00:00');
    vi.setSystemTime(now);
    const todayKey = '2026-02-24';

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-23': ['2026-02-23T12:00:00.000'],
          [todayKey]: ['2026-02-24T00:10:00.000', '2026-02-24T01:00:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    await act(async () => {
      screen.getByRole('button', { name: '今日の成果を表示' }).click();
    });
    let dialog = screen.getByRole('dialog', { name: '今日の成果' });
    expect(within(dialog).getByText('★ 自己ベスト更新')).toBeInTheDocument();
    await act(async () => {
      within(dialog).getByRole('button', { name: '閉じる' }).click();
    });

    await act(async () => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    await act(async () => {
      screen.getByRole('button', { name: '今日の成果を表示' }).click();
    });
    dialog = screen.getByRole('dialog', { name: '今日の成果' });
    expect(within(dialog).getByText('★ 自己ベスト更新')).toBeInTheDocument();
  });

  test('成果条件に該当しない日は成果ティッカーを表示しない', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-24T12:00:00');
    vi.setSystemTime(now);

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-01-20': ['2026-01-20T00:00:00.000', '2026-01-20T05:00:00.000'],
          '2026-02-18': ['2026-02-18T00:00:00.000', '2026-02-18T04:00:00.000'],
          '2026-02-23': ['2026-02-23T00:00:00.000', '2026-02-23T03:00:00.000'],
          '2026-02-24': [
            '2026-02-24T00:05:00.000',
            '2026-02-24T01:05:00.000',
            '2026-02-24T02:05:00.000',
            '2026-02-24T03:05:00.000',
            '2026-02-24T04:05:00.000',
            '2026-02-24T05:05:00.000',
            '2026-02-24T06:05:00.000',
            '2026-02-24T07:05:00.000',
            '2026-02-24T08:05:00.000',
            '2026-02-24T09:05:00.000',
            '2026-02-24T10:05:00.000',
            '2026-02-24T11:05:00.000',
          ],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(document.getElementById('todayLongestDisplay')?.textContent || '').not.toBe('');
    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
  });

  test('無料版では60日より前のログを自己ベスト計算に含めない', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2025-12-26': ['2025-12-26T04:00:00.000Z', '2025-12-26T04:22:00.000Z'],
          '2026-02-25': ['2026-02-25T08:00:00.000Z', '2026-02-25T10:00:00.000Z'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(document.getElementById('bestIntervalDisplay')?.textContent).toBe('2時間00分');
  });

  test('記録ゼロでは成果ログなし・初期メッセージを表示する', () => {
    renderApp({ path: '/main' });
    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
    expect(screen.getByText('記録を始めましょう')).toBeInTheDocument();
  });

  test('初回記録日は更新イベントを表示しない', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T02:20:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-24': ['2026-02-24T00:10:00.000', '2026-02-24T02:10:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
  });

  test('今週初日の記録では今週最高更新を出さない', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-22T02:20:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-15': ['2026-02-15T00:10:00.000', '2026-02-15T04:10:00.000'],
          '2026-01-20': ['2026-01-20T00:10:00.000', '2026-01-20T04:10:00.000'],
          '2026-02-22': ['2026-02-22T00:10:00.000', '2026-02-22T02:10:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
  });

  test('先週データが無い場合は先週更新イベントを出さない', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T02:20:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-23': ['2026-02-23T00:10:00.000', '2026-02-23T04:10:00.000'],
          '2026-01-20': ['2026-01-20T00:10:00.000', '2026-01-20T04:10:00.000'],
          '2026-02-24': ['2026-02-24T00:10:00.000', '2026-02-24T02:10:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
  });

  test('先月データが無い場合は先月更新イベントを出さない', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T02:20:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-17': ['2026-02-17T00:10:00.000', '2026-02-17T04:10:00.000'],
          '2026-02-23': ['2026-02-23T00:10:00.000', '2026-02-23T04:10:00.000'],
          '2026-02-24': ['2026-02-24T00:10:00.000', '2026-02-24T02:10:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('button', { name: '今日の成果を表示' })).toBeNull();
  });

  test('比較対象が存在して条件を超えたときだけ成果イベントを出す', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T23:00:00'));

    renderApp({
      path: '/main',
      persisted: {
        logs: {
          '2026-02-17': ['2026-02-17T12:00:00.000'],
          '2026-02-23': ['2026-02-23T23:30:00.000'],
          '2026-02-24': ['2026-02-24T00:10:00.000', '2026-02-24T01:00:00.000'],
        },
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const ticker = screen.getByRole('button', { name: '今日の成果を表示' });
    await act(async () => {
      ticker.click();
    });
    const dialog = screen.getByRole('dialog', { name: '今日の成果' });
    expect(within(dialog).getByText('▲ 先週最高を更新')).toBeInTheDocument();
  });
});

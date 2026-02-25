import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';

describe('StatsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('weekでは曜日別ボタンが無効', () => {
    renderApp({ path: '/stats' });
    const weekdayBtn = document.getElementById('graph-weekday') as HTMLButtonElement | null;
    expect(weekdayBtn).not.toBeNull();
    expect(weekdayBtn?.disabled).toBe(true);
  });

  test('monthへ切替すると曜日別ボタンが有効', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/stats' });

    const monthBtn = document.getElementById('range-month') as HTMLButtonElement;
    await user.click(monthBtn);

    const weekdayBtn = document.getElementById('graph-weekday') as HTMLButtonElement;
    expect(weekdayBtn.disabled).toBe(false);
  });

  test('allへ切替すると期間移動ボタンが無効', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/stats' });

    await user.click(document.getElementById('range-all') as HTMLButtonElement);

    expect((document.getElementById('stats-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById('stats-next') as HTMLButtonElement).disabled).toBe(true);
  });

  test('month + 時間帯別ではラベルが間引かれて描画される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const d1 = `${ym}-01`;
    const d2 = `${ym}-02`;

    renderApp({
      path: '/stats',
      persisted: {
        logs: {
          [d1]: [`${d1}T10:00:00`, `${d1}T10:30:00`],
          [d2]: [],
        },
      },
    });

    await user.click(document.getElementById('range-month') as HTMLButtonElement);
    await user.click(document.getElementById('graph-hourly') as HTMLButtonElement);

    expect(document.getElementById('stats-title')?.textContent).toBe('時間帯別本数（平均）');
    expect(document.getElementById('stats-label')?.textContent).toBe(ym.replace('-', '/'));
    expect(document.getElementById('stats-chart-1')).not.toBeNull();
  });

  test('weekでは前期間比較の差分のみ表示される', () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const currentDay = fmt(start);
    const prevDay = fmt(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7));

    renderApp({
      path: '/stats',
      persisted: {
        logs: {
          [currentDay]: [`${currentDay}T10:00:00`, `${currentDay}T11:00:00`],
          [prevDay]: [`${prevDay}T10:00:00`],
        },
      },
    });

    const text = document.getElementById('stats-current-avg')?.textContent ?? '';
    expect(text).toContain('前期間比較: +1本');
    expect(text).not.toContain('%');
  });

  test('weekで前期間ゼロの場合も割合表示は付かない', () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const currentDay = fmt(start);

    renderApp({
      path: '/stats',
      persisted: {
        logs: {
          [currentDay]: [`${currentDay}T10:00:00`],
        },
      },
    });

    const text = document.getElementById('stats-current-avg')?.textContent ?? '';
    expect(text).toContain('前期間比較: +1本');
    expect(text).not.toContain('%');
  });
});

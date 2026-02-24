import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';

describe('App navigation sync', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('ボトムナビ操作でURLとアクティブタブが同期する', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/main' });

    const statsTab = document.querySelector('nav button[data-tab="/stats"]') as HTMLButtonElement | null;
    expect(statsTab).not.toBeNull();
    await user.click(statsTab!);

    expect(window.location.pathname).toBe('/stats');
    expect(statsTab?.getAttribute('aria-selected')).toBe('true');

    const calendarTab = document.querySelector('nav button[data-tab="/calendar"]') as HTMLButtonElement | null;
    expect(calendarTab).not.toBeNull();
    await user.click(calendarTab!);

    expect(window.location.pathname).toBe('/calendar');
    expect(calendarTab?.getAttribute('aria-selected')).toBe('true');
  });

  test('タイムラインをタブ遷移で開いた場合は戻るリンクが表示されない', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(Math.max(1, now.getDate() - 1)).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: { [dayKey]: [`${dayKey}T10:00:00`] },
      },
    });

    const cell = Array.from(document.querySelectorAll('.calendar-day:not(.gray)')).find(
      (el) => (el as HTMLElement).querySelector('.day-number')?.textContent?.trim() === String(Number(d)),
    ) as HTMLButtonElement | undefined;
    expect(cell).toBeDefined();
    await user.click(cell!);
    await user.click(document.querySelector('.calendar-detail-link-btn') as HTMLButtonElement);
    expect(document.getElementById('timelineBackLink')).not.toBeNull();

    await user.click(document.querySelector('nav button[data-tab="/timeline"]') as HTMLButtonElement);
    expect(window.location.search).toBe('');
    expect(document.getElementById('timelineBackLink')).toBeNull();
  });
});

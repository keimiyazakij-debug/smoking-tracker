import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../helpers/renderApp';

function getMonthCell(day: string): HTMLButtonElement | undefined {
  const cells = Array.from(document.querySelectorAll('.calendar-day:not(.gray)')) as HTMLButtonElement[];
  return cells.find((cell) => cell.querySelector('.day-number')?.textContent?.trim() === day);
}

describe('integration/appFlow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('mainで記録後に今日の履歴へ移動し、メインへ戻れる', async () => {
    const user = userEvent.setup();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    renderApp({ path: '/main' });
    await user.click(document.getElementById('smokeBtn') as HTMLButtonElement);
    await user.click(document.getElementById('todayTimelineLink') as HTMLButtonElement);

    expect(window.location.pathname).toBe('/timeline');
    expect(document.getElementById('timelineTitle')?.textContent).toBe(todayKey.replaceAll('-', '/'));
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 1本');
    expect(document.getElementById('timelineBackLink')?.textContent).toBe('← メインに戻る');

    await user.click(document.getElementById('timelineBackLink') as HTMLButtonElement);
    expect(window.location.pathname).toBe('/main');
  });

  test('calendarから任意日timelineを開き、カレンダーに戻れる', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = Math.max(1, now.getDate() - 1);
    const dayKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T09:00:00`, `${dayKey}T12:00:00`],
        },
      },
    });

    const cell = getMonthCell(String(d));
    expect(cell).toBeDefined();
    await user.click(cell!);
    await user.click(document.querySelector('.calendar-detail-link-btn') as HTMLButtonElement);

    expect(window.location.pathname).toBe('/timeline');
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 2本');
    expect(document.getElementById('timelineBackLink')?.textContent).toBe('← カレンダーに戻る');

    await user.click(document.getElementById('timelineBackLink') as HTMLButtonElement);
    expect(window.location.pathname).toBe('/calendar');
  });
});

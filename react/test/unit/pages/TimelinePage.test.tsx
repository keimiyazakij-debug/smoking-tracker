import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';
import { FREE_LIMIT_DAYS } from '../../../src/domain/date';

function getMonthCell(day: string): HTMLButtonElement | undefined {
  const cells = Array.from(document.querySelectorAll('.calendar-day:not(.gray)')) as HTMLButtonElement[];
  return cells.find((cell) => cell.querySelector('.day-number')?.textContent?.trim() === day);
}

describe('TimelinePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('カレンダー経由で開くと戻る文言が「カレンダーに戻る」になる', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const day = Math.max(1, now.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayKey = `${y}-${pad(m)}-${pad(day)}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T10:00:00`],
        },
      },
    });

    const cell = getMonthCell(String(day));
    expect(cell).toBeDefined();
    await user.click(cell!);
    await user.click(document.querySelector('.calendar-detail-link-btn') as HTMLButtonElement);

    const link = document.getElementById('timelineBackLink');
    expect(link?.textContent).toBe('← カレンダーに戻る');
  });

  test('ホーム経由で開くと戻る文言が「メインに戻る」になる', () => {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    renderApp({
      path: `/timeline?date=${dayKey}&from=home&sourceDate=${dayKey}`,
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T10:00:00`],
        },
      },
    });

    const link = document.getElementById('timelineBackLink');
    expect(link?.textContent).toBe('← メインに戻る');
  });

  test('今日のタイムラインでは次へボタンがhiddenになる', () => {
    renderApp({ path: '/timeline' });
    const nextBtn = document.getElementById('nextTimelineDay') as HTMLButtonElement | null;
    expect(nextBtn).not.toBeNull();
    expect(nextBtn?.style.visibility).toBe('hidden');
  });

  test('時間帯ごとの本数とヒートクラスが表示される', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayKey = `${y}-${pad(m)}-${pad(d)}`;

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [todayKey]: [`${todayKey}T09:05:00`, `${todayKey}T09:20:00`, `${todayKey}T15:10:00`],
        },
      },
    });

    const cells = Array.from(document.querySelectorAll('.timeline-cell'));
    expect(cells[9].className).toContain('count-2');
    expect(cells[15].className).toContain('count-1');
    expect(cells[9].textContent).toContain('2本');
    expect(cells[15].textContent).toContain('1本');
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 3本');
  });

  test('前日/翌日ナビゲーションで日付と集計が更新される', async () => {
    const user = userEvent.setup();
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(d1.getDate() - 1);
    const d2 = new Date(today);
    d2.setDate(d2.getDate() - 2);
    const toKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const y1 = toKey(d1);
    const y2 = toKey(d2);

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [y1]: [`${y1}T08:00:00`],
          [y2]: [`${y2}T09:00:00`, `${y2}T10:00:00`],
        },
      },
    });

    await user.click(document.getElementById('prevTimelineDay') as HTMLButtonElement);
    expect(document.getElementById('timelineTitle')?.textContent).toBe(y1.replaceAll('-', '/'));
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 1本');
    expect((document.getElementById('nextTimelineDay') as HTMLButtonElement).style.visibility).toBe('visible');

    await user.click(document.getElementById('prevTimelineDay') as HTMLButtonElement);
    expect(document.getElementById('timelineTitle')?.textContent).toBe(y2.replaceAll('-', '/'));
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 2本');

    await user.click(document.getElementById('nextTimelineDay') as HTMLButtonElement);
    expect(document.getElementById('timelineTitle')?.textContent).toBe(y1.replaceAll('-', '/'));
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 1本');
  });

  test('時間セルクリックで編集画面が開く', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T09:05:00`],
        },
      },
    });

    const button = document.querySelectorAll('.timeline-cell button')[9] as HTMLButtonElement;
    await user.click(button);

    expect(document.getElementById('editOverlay')?.className).not.toContain('hidden');
    expect(document.getElementById('editTitle')?.textContent).toContain('9時台');
  });

  test('編集画面で時刻を保存すると集計に反映される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T09:05:00`],
        },
      },
    });

    await user.click(document.querySelectorAll('.timeline-cell button')[9] as HTMLButtonElement);
    const hourSelect = document.querySelector('#timeTags .time-select-hour') as HTMLSelectElement;
    const minuteSelect = document.querySelector('#timeTags .time-select-minute') as HTMLSelectElement;
    await user.selectOptions(hourSelect, '09');
    await user.selectOptions(minuteSelect, '10');
    await user.click(document.getElementById('saveEditBtn') as HTMLButtonElement);

    expect(document.getElementById('editOverlay')?.className).toContain('hidden');
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 1本');

    const raw = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.logs?.[dayKey]?.length).toBe(1);
  });

  test('当日のログがあると全削除ボタンが表示され、押下で削除される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T09:05:00`],
        },
      },
    });

    const deleteBtn = document.getElementById('timelineDeleteAllBtn') as HTMLButtonElement | null;
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn?.style.display).toBe('inline-block');
    await user.click(deleteBtn!);

    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 0本');
    expect((document.getElementById('timelineDeleteAllBtn') as HTMLButtonElement).style.display).toBe('none');

    const raw = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.logs?.[dayKey]).toBeUndefined();
  });

  test('編集画面で時刻をすべて削除して保存すると、その時間帯の記録が削除される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/timeline',
      persisted: {
        logs: {
          [dayKey]: [`${dayKey}T09:05:00`, `${dayKey}T10:15:00`],
        },
      },
    });

    await user.click(document.querySelectorAll('.timeline-cell button')[9] as HTMLButtonElement);
    await user.click(document.querySelector('#timeTags .time-tag button') as HTMLButtonElement);
    await user.click(document.getElementById('saveEditBtn') as HTMLButtonElement);

    expect(document.getElementById('editOverlay')?.className).toContain('hidden');
    expect(document.getElementById('timelineSummary')?.textContent).toBe('合計 1本');

    const raw = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.logs?.[dayKey]).toHaveLength(1);
    expect(parsed?.logs?.[dayKey]?.[0]).toContain('T10:15:00');
  });

  test('無料モードでロック境界を超える日の前日ボタンはhiddenになる', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/timeline' });

    for (let i = 0; i < FREE_LIMIT_DAYS; i += 1) {
      await user.click(document.getElementById('prevTimelineDay') as HTMLButtonElement);
    }

    expect((document.getElementById('prevTimelineDay') as HTMLButtonElement).style.visibility).toBe('hidden');
  });
});

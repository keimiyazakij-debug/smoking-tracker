import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';
import { FREE_LIMIT_DAYS } from '../../../src/domain/date';

function getMonthCell(day: string): HTMLButtonElement | undefined {
  const cells = Array.from(document.querySelectorAll('.calendar-day:not(.gray)')) as HTMLButtonElement[];
  return cells.find((cell) => cell.querySelector('.day-number')?.textContent?.trim() === day);
}

describe('CalendarPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('今日は禁煙成功で確定ボタンが表示されない', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const day = now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayKey = `${y}-${pad(m)}-${pad(day)}`;
    const firstRecordedDay = Math.max(1, day - 2);
    const firstRecordedKey = `${y}-${pad(m)}-${pad(firstRecordedDay)}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [firstRecordedKey]: [`${firstRecordedKey}T10:00:00`],
        },
      },
    });

    const todayCell = getMonthCell(String(day));
    expect(todayCell).toBeDefined();
    await user.click(todayCell!);

    expect(todayKey).toBeTruthy();
    expect(document.querySelector('.calendar-detail-success-btn')).toBeNull();
  });

  test('過去未記録日は禁煙成功で確定ボタンが表示される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const day = now.getDate();
    if (day <= 1) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const pastDay = day - 1;
    const firstRecordedDay = Math.max(1, day - 3);
    const firstRecordedKey = `${y}-${pad(m)}-${pad(firstRecordedDay)}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [firstRecordedKey]: [`${firstRecordedKey}T10:00:00`],
        },
      },
    });

    const pastCell = getMonthCell(String(pastDay));
    expect(pastCell).toBeDefined();
    await user.click(pastCell!);

    expect(document.querySelector('.calendar-detail-success-btn')).not.toBeNull();
  });

  test('月移動ボタンでタイトルが前月・翌月へ切り替わる', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/calendar' });
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    expect(document.getElementById('calendarTitle')?.textContent).toBe(`${current.getFullYear()}年 ${current.getMonth() + 1}月`);

    const buttons = Array.from(document.querySelectorAll('.calendar-header button')) as HTMLButtonElement[];
    await user.click(buttons[0]);
    expect(document.getElementById('calendarTitle')?.textContent).toBe(`${prev.getFullYear()}年 ${prev.getMonth() + 1}月`);

    await user.click(buttons[1]);
    expect(document.getElementById('calendarTitle')?.textContent).toBe(`${current.getFullYear()}年 ${current.getMonth() + 1}月`);
  });

  test('メモが空のときは「メモはまだありません」を表示する', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/calendar' });
    const now = new Date();
    const cell = getMonthCell(String(now.getDate()));
    expect(cell).toBeDefined();
    await user.click(cell!);
    expect(document.querySelector('.memo-empty')?.textContent).toBe('メモはまだありません');
  });

  test('記録が無い月へ移動しても詳細エリアが消えない', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [todayKey]: [`${todayKey}T10:00:00`],
        },
      },
    });

    const buttons = Array.from(document.querySelectorAll('.calendar-header button')) as HTMLButtonElement[];
    await user.click(buttons[1]);

    const detail = document.getElementById('calendarDetail') as HTMLElement;
    expect(detail.hidden).toBe(false);
    expect(document.querySelector('.memo-card')).not.toBeNull();
  });

  test('カレンダーセルに本数が表示され、目標本数で色分けされる', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/calendar',
      persisted: {
        logs: {
          [todayKey]: [`${todayKey}T09:00:00`, `${todayKey}T10:00:00`],
        },
        settings: {
          dailyTarget: 1,
          calendarEvaluation: 'target',
        },
      },
    });

    const todayCell = getMonthCell(String(now.getDate()));
    expect(todayCell).toBeDefined();
    expect(todayCell?.querySelector('.count-number')?.textContent).toBe('2');
    expect(todayCell?.querySelector('.count-bg')?.className).toContain('count-exceeded');
  });

  test('メモがある日はグリッド右上にインジケーターが表示される', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;

    renderApp({
      path: '/calendar',
      persisted: {
        memos: {
          [todayKey]: 'memo exists',
        },
      },
    });

    const todayCell = getMonthCell(String(now.getDate()));
    expect(todayCell).toBeDefined();
    expect(todayCell?.querySelector('.memo-indicator')).not.toBeNull();
  });

  test('休日キャッシュがある日はholidayクラスが付く', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;
    window.localStorage.setItem(`holidays_${y}`, JSON.stringify([{ date: todayKey, localName: '祝日', name: 'Holiday' }]));

    renderApp({ path: '/calendar' });

    const todayCell = getMonthCell(String(now.getDate()));
    expect(todayCell).toBeDefined();
    expect(todayCell?.className).toContain('holiday');
  });

  test('メモ入力は保存され、空にすると削除される', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const day = String(now.getDate());
    const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    renderApp({ path: '/calendar' });
    const cell = getMonthCell(day);
    expect(cell).toBeDefined();
    await user.click(cell!);

    await user.click(document.querySelector('.memo-edit-btn') as HTMLButtonElement);
    const memo = document.querySelector('.memo-editor') as HTMLTextAreaElement | null;
    expect(memo).not.toBeNull();
    await user.type(memo!, 'test memo\nline2');
    await user.click(document.querySelector('.memo-actions .memo-edit-btn') as HTMLButtonElement);

    await user.click(document.querySelector('.memo-edit-btn') as HTMLButtonElement);
    const memo2 = document.querySelector('.memo-editor') as HTMLTextAreaElement | null;
    expect(memo2).not.toBeNull();
    await user.clear(memo2!);
    await user.type(memo2!, 'savedmemo');
    await user.click(document.querySelector('.memo-actions .memo-edit-btn') as HTMLButtonElement);

    const raw1 = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed1 = raw1 ? JSON.parse(raw1) : null;
    expect(parsed1?.memos?.[dayKey]).toBe('savedmemo');

    await user.click(document.querySelector('.memo-edit-btn') as HTMLButtonElement);
    const memo3 = document.querySelector('.memo-editor') as HTMLTextAreaElement | null;
    expect(memo3).not.toBeNull();
    await user.clear(memo3!);
    await user.click(document.querySelector('.memo-actions .memo-edit-btn') as HTMLButtonElement);
    const raw2 = window.localStorage.getItem('smoking_tracker_react_state');
    const parsed2 = raw2 ? JSON.parse(raw2) : null;
    expect(parsed2?.memos?.[dayKey]).toBeUndefined();
  });

  test('無料モードで60日より前の月はロックされ、編集導線が表示されない', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/calendar' });

    const locked = new Date();
    locked.setDate(locked.getDate() - (FREE_LIMIT_DAYS + 1));
    const targetYear = locked.getFullYear();
    const targetMonth = locked.getMonth() + 1;

    const prevBtn = (document.querySelectorAll('.calendar-header button')[0] as HTMLButtonElement);
    const titleEl = document.getElementById('calendarTitle') as HTMLSpanElement;
    const targetTitle = `${targetYear}年 ${targetMonth}月`;

    let guard = 24;
    while (titleEl.textContent !== targetTitle && guard > 0) {
      await user.click(prevBtn);
      guard -= 1;
    }

    expect(titleEl.textContent).toBe(targetTitle);
    expect(document.querySelector('.calendar-day.locked')).not.toBeNull();
    expect(document.querySelector('.calendar-day.locked .lock-mark')?.textContent).toBe('🔒');
    expect(document.querySelector('.calendar-detail-link-btn')).toBeNull();
    expect(document.querySelector('.memo-edit-btn')).toBeNull();
    expect(document.getElementById('calendarDetail')?.textContent).toContain('60日より前のデータはプレミアム版で閲覧できます。');
  });
});

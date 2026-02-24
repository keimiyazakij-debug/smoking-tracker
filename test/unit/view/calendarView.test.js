/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('calendarView', () => {
  beforeEach(() => {
    // ===== 前提DOM（index.html相当）=====
    document.body.innerHTML = `
      <button id="calendarPrev"></button>
      <button id="calendarNext"></button>
      <h2 id="calendarTitle"></h2>
      <div id="calendarGrid"></div>
    `;

    // ===== Controller / Model 最小モック =====
    window.calendarController = {
      prevMonth: jest.fn(),
      nextMonth: jest.fn(),
      onDayClick: jest.fn(),
    };

    // ===== View 読み込み =====
    loadBrowserScript(
      '../app/view/calendarView.js',
      {
        calendarController: window.calendarController,
      }
    );
  });

  test('render: 曜日ヘッダが7つ描画される', () => {
    window.calendarView.render(baseCtx());

    const heads = document.querySelectorAll('.calendar-head');
    expect(heads.length).toBe(7);
    expect(heads[0].textContent).toBe('日');
    expect(heads[6].textContent).toBe('土');
  });

  test('render: 当月の日付セルが描画される', () => {
    window.calendarView.render(baseCtx());

    const days = document.querySelectorAll('.calendar-day');
    // 前月＋当月＋翌月を含むが、最低限当月日数はある
    expect(days.length).toBeGreaterThanOrEqual(28);
  });

  test('render: タイトルが更新される', () => {
    const ctx = baseCtx();
    window.calendarView.render(ctx);

    const title = document.getElementById('calendarTitle');
    expect(title.textContent).toBe('2026年 2月');
  });

  test('render: 日付クリックで controller.onDayClick が呼ばれる', () => {
    const ctx = baseCtx();
    window.calendarView.render(ctx);

    const cell = document.querySelector('.calendar-day:not(.gray)');
    cell.click();

    expect(window.calendarController.onDayClick).toHaveBeenCalledWith('2026-02-01');
  });

  test('render: 未記録/目標以内/超過に応じて count-bg クラスが付与される', () => {
    const ctx = baseCtx();
    ctx.days[0].status = 'unrecorded';
    ctx.days[0].count = null;
    ctx.days[1].status = 'success';
    ctx.days[1].count = 0;
    ctx.days[2].status = 'smoke';
    ctx.days[2].count = 3;
    ctx.days[3].status = 'smoke';
    ctx.days[3].count = 12;
    ctx.target = 10;

    window.calendarView.render(ctx);

    const cells = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'));
    const getCountBg = (day) => {
      const cell = cells.find(c => c.querySelector('.day-number')?.textContent === String(day));
      return cell ? cell.querySelector('.count-bg') : null;
    };

    expect(getCountBg(1).classList.contains('count-unrecorded')).toBe(true);
    expect(getCountBg(2).classList.contains('count-achieved')).toBe(true);
    expect(getCountBg(3).classList.contains('count-achieved')).toBe(true);
    expect(getCountBg(4).classList.contains('count-exceeded')).toBe(true);
  });

  test('render: 週数に応じて --calendar-rows が設定される', () => {
    const ctx4 = baseCtx();
    ctx4.firstDay = 0;
    ctx4.lastDate = 28;
    window.calendarView.render(ctx4);
    const grid4 = document.getElementById('calendarGrid');
    expect(grid4.style.getPropertyValue('--calendar-rows')).toBe('4');

    const ctx5 = baseCtx();
    ctx5.firstDay = 3;
    ctx5.lastDate = 31;
    window.calendarView.render(ctx5);
    const grid5 = document.getElementById('calendarGrid');
    expect(grid5.style.getPropertyValue('--calendar-rows')).toBe('5');

    const ctx6 = baseCtx();
    ctx6.firstDay = 6;
    ctx6.lastDate = 31;
    window.calendarView.render(ctx6);
    const grid6 = document.getElementById('calendarGrid');
    expect(grid6.style.getPropertyValue('--calendar-rows')).toBe('6');
  });

  test('render: 本数表示は数字のみ（単位なし）', () => {
    const ctx = baseCtx();
    ctx.days[0].count = 5;
    window.calendarView.render(ctx);

    const cell = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '1');
    const countText = cell?.querySelector('.count-number')?.textContent;
    expect(countText).toBe('5');
  });

  test('render: 選択日には selected クラスが付く', () => {
    const ctx = baseCtx({ selectedDateKey: '2026-02-03' });
    window.calendarView.render(ctx);

    const selectedCell = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '3');
    expect(selectedCell.classList.contains('selected')).toBe(true);
  });

  test('render: 今日かつ選択日なら today と selected の両方が付く', () => {
    const ctx = baseCtx({
      todayKey: '2026-02-01',
      selectedDateKey: '2026-02-01',
    });
    window.calendarView.render(ctx);

    const todayCell = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '1');
    expect(todayCell.classList.contains('today')).toBe(true);
    expect(todayCell.classList.contains('selected')).toBe(true);
  });

  test('render: メモがある日は memo-indicator が表示される', () => {
    const ctx = baseCtx();
    ctx.days[0].hasMemo = true;
    window.calendarView.render(ctx);

    const day1 = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '1');
    expect(day1.querySelector('.memo-indicator')).not.toBeNull();
  });

  test('render: メモがない日は memo-indicator を表示しない', () => {
    const ctx = baseCtx();
    ctx.days[0].hasMemo = false;
    window.calendarView.render(ctx);

    const day1 = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '1');
    expect(day1.querySelector('.memo-indicator')).toBeNull();
  });

  test('render: 祝日は holiday クラスが付与される', () => {
    const ctx = baseCtx();
    ctx.days[0].isHoliday = true;
    ctx.days[0].holidayName = '元日';
    window.calendarView.render(ctx);

    const day1 = Array.from(document.querySelectorAll('.calendar-day:not(.gray)'))
      .find(c => c.querySelector('.day-number')?.textContent === '1');
    expect(day1.classList.contains('holiday')).toBe(true);
    expect(day1.getAttribute('title')).toBe('祝日: 元日');
  });

  test('render: 斜め矢印は表示しない', () => {
    const ctx = baseCtx();
    window.calendarView.render(ctx);

    expect(document.querySelector('.trend-indicator')).toBeNull();
  });
});

/**
 * calendarView.render 用の最小 ctx
 */
function baseCtx(overrides = {}) {
  const lastDate = overrides.lastDate ?? 28;
  const days = Array.from({ length: lastDate }, (_, i) => {
    const day = i + 1;
    return {
      day,
      dateKey: `2026-02-${String(day).padStart(2, '0')}`,
      count: null,
      status: 'unrecorded',
      hasLog: false,
      hasMemo: false,
    };
  });
  return {
    year: 2026,
    month: 1, // 0-based（2月）
    firstDay: 0,
    lastDate,
    prevLastDate: 31,
    todayKey: '2026-02-01',
    target: 10,
    calendarData: {},
    days,
    ...overrides,
  };
}

import type { Logs } from '../types/app';
import { getDateKey, getDayStatus } from './date';

export type CalendarCell = {
  day: number;
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  status: 'unrecorded' | 'smoke' | 'success';
  count: number | null;
};

export function buildCalendarCells(year: number, month: number, todayKey: string, logs: Logs): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const d = prevLastDate - i;
    const date = new Date(year, month - 1, d);
    const dateKey = getDateKey(date);
    cells.push({
      day: d,
      dateKey,
      inMonth: false,
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      status: getDayStatus(dateKey, logs),
      count: Object.prototype.hasOwnProperty.call(logs, dateKey) ? logs[dateKey].length : null,
    });
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);
    cells.push({
      day,
      dateKey,
      inMonth: true,
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      status: getDayStatus(dateKey, logs),
      count: Object.prototype.hasOwnProperty.call(logs, dateKey) ? logs[dateKey].length : null,
    });
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (firstDay + lastDate) + 1;
    const date = new Date(year, month + 1, day);
    const dateKey = getDateKey(date);
    cells.push({
      day,
      dateKey,
      inMonth: false,
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      status: getDayStatus(dateKey, logs),
      count: Object.prototype.hasOwnProperty.call(logs, dateKey) ? logs[dateKey].length : null,
    });
  }

  return cells;
}

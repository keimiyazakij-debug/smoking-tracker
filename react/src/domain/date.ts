import type { Logs } from '../types/app';

export const FREE_LIMIT_DAYS = 60;

export function getDateKey(date: Date = new Date()): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDurationFromMinutes(totalMin: number): string {
  if (totalMin < 60) return `${totalMin}分`;
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours < 24) return `${hours}時間${minutes}分`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days}日${remainHours}時間`;
}

export function getDayStatus(dateKey: string, logs: Logs): 'unrecorded' | 'smoke' | 'success' {
  const day = logs[dateKey];
  if (day === undefined) return 'unrecorded';
  if (Array.isArray(day) && day.length > 0) return 'smoke';
  return 'success';
}

export function getLastSmokeTime(logs: Logs): Date | null {
  let last: Date | null = null;
  Object.values(logs).forEach((times) => {
    times.forEach((ts) => {
      const d = new Date(ts);
      if (!last || d > last) last = d;
    });
  });
  return last;
}

export function getConsecutiveNoSmokeDays(logs: Logs, todayKey: string): number {
  const keys = Object.keys(logs);
  if (keys.length === 0) return 0;
  const earliest = parseDateKey(keys.sort()[0]);
  const d = parseDateKey(todayKey);
  let count = 0;
  while (d >= earliest) {
    const key = getDateKey(d);
    const status = getDayStatus(key, logs);
    if (status === 'unrecorded' || status === 'smoke') break;
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function isDateLocked(dateInput: string | Date, isPremium: boolean): boolean {
  if (isPremium) return false;
  const today = parseDateKey(getDateKey(new Date()));
  const target = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput;
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const to = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((from.getTime() - to.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > FREE_LIMIT_DAYS;
}

export function getMonthDateKeys(baseDate: Date): string[] {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const out: string[] = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) {
    out.push(getDateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function getWeekDateKeys(baseDate: Date): string[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(d);
    cur.setDate(d.getDate() + i);
    return getDateKey(cur);
  });
}

export function moveBaseDate(baseDate: Date, mode: 'week' | 'month' | 'all', dir: -1 | 1): Date {
  const d = new Date(baseDate);
  if (mode === 'week') {
    d.setDate(d.getDate() + dir * 7);
    return d;
  }
  if (mode === 'month') {
    d.setMonth(d.getMonth() + dir);
  }
  return d;
}

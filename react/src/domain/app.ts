import type { Logs } from '../types/app';
import { formatDurationFromMinutes, getDateKey, getLastSmokeTime, parseDateKey } from './date';

export function getTodayCount(logs: Logs, todayKey: string): number {
  return logs[todayKey]?.length ?? 0;
}

export function getYesterdayKey(todayKey: string): string {
  const d = parseDateKey(todayKey);
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
}

export function getYesterdayCount(logs: Logs, todayKey: string): number | null {
  const key = getYesterdayKey(todayKey);
  return Object.prototype.hasOwnProperty.call(logs, key) ? (logs[key]?.length ?? 0) : null;
}

export function getSinceText(logs: Logs): string {
  const last = getLastSmokeTime(logs);
  if (!last) return '禁煙中（今日はまだ吸っていません）';
  const minutes = Math.floor((Date.now() - last.getTime()) / 60000);
  const hh = String(last.getHours()).padStart(2, '0');
  const mm = String(last.getMinutes()).padStart(2, '0');
  return `禁煙中：${hh}時${mm}分から ${formatDurationFromMinutes(minutes)}経過`;
}

export function getWeekSummary(logs: Logs, todayKey: string) {
  const today = parseDateKey(todayKey);
  const countFor = (date: Date) => logs[getDateKey(date)]?.length ?? 0;

  let sum7 = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    sum7 += countFor(d);
  }

  const dow = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - dow);

  let thisWeek = 0;
  let lastWeek = 0;
  for (let i = 0; i < 7; i += 1) {
    const a = new Date(weekStart);
    a.setDate(a.getDate() + i);
    thisWeek += countFor(a);

    const b = new Date(weekStart);
    b.setDate(b.getDate() - 7 + i);
    lastWeek += countFor(b);
  }

  return {
    avg7: (sum7 / 7).toFixed(1),
    thisWeek,
    lastWeek,
  };
}

export function buildSmokeMessage(todayCount: number, targetCount: number): string {
  const messagesBelow = [
    '目標以内です。いい流れです。',
    '今日もコントロールできています。',
    '順調です。このままいきましょう。',
  ];
  const messagesEqual = [
    '目標ラインです。ここからが大事。',
    '今日はここで止められると最高です。',
    'あと少し、整えていきましょう。',
  ];
  const messagesOver = [
    '記録できたことが前進です。',
    '大丈夫、また整えていきましょう。',
    '続けていること自体が大切です。',
  ];

  let pool = messagesOver;
  if (todayCount < targetCount) pool = messagesBelow;
  else if (todayCount === targetCount) pool = messagesEqual;
  return pool[Math.floor(Math.random() * pool.length)];
}

import { getDateKey, getMonthDateKeys, getWeekDateKeys, isDateLocked, parseDateKey } from './date';
import { getAwakeInterval } from '../hooks/useAwakeInterval';
import type { Logs, Settings } from '../types/app';

export type IntervalRange = 'recent7' | 'week' | 'month' | 'all';
export type IntervalMarker = 'PB' | 'OVER_LAST_WEEK' | 'OVER_LAST_MONTH';

export type DailyGapSummary = {
  dateKey: string;
  maxGapMinutes: number;
  maxGapStartTs: string | null;
  maxGapEndTs: string | null;
};

export type IntervalPoint = {
  dateKey: string;
  label: string;
  maxGapMinutes: number;
  trendMinutes: number | null;
  markers: IntervalMarker[];
};

export type IntervalStoryState = {
  points: IntervalPoint[];
  summaryTitle: string;
  summaryValue: string;
  summaryDiffText: string;
  recent7MinText: string;
  recent7AvgText: string;
  periodLabel: string;
  canNavigate: boolean;
  showPremiumNotice: boolean;
};

function formatCompactHM(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return getDateKey(d);
}

function getLastMonthDateKeys(baseDate: Date): string[] {
  return getMonthDateKeys(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1));
}

function getMaxByKeys(summaryMap: Record<string, DailyGapSummary>, keys: string[]): number {
  return keys.reduce((max, key) => Math.max(max, summaryMap[key]?.maxGapMinutes ?? 0), 0);
}

function hasAnySummary(summaryMap: Record<string, DailyGapSummary>, keys: string[]): boolean {
  return keys.some((key) => summaryMap[key] != null);
}

function formatDiffMinutes(diffMinutes: number): string {
  if (diffMinutes === 0) return '±0分';
  return `${diffMinutes > 0 ? '+' : ''}${diffMinutes}分`;
}

function formatWeekLabel(baseDate: Date): string {
  const weekKeys = getWeekDateKeys(baseDate);
  const start = weekKeys[0] ?? getDateKey(baseDate);
  return `${start.replaceAll('-', '/')}週`;
}

function formatMonthLabel(baseDate: Date): string {
  return `${baseDate.getFullYear()}/${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
}

function formatAllLabel(summaryMap: Record<string, DailyGapSummary>): string {
  const keys = Object.keys(summaryMap).sort();
  if (keys.length === 0) return '記録なし';
  const first = keys[0]?.slice(0, 7).replace('-', '/');
  const last = keys[keys.length - 1]?.slice(0, 7).replace('-', '/');
  if (!first || !last) return '記録なし';
  return first === last ? first : `${first}〜${last}`;
}

function buildDaySummary(dateKey: string, logs: Logs, now: Date, settings: Settings): DailyGapSummary {
  const dayStart = parseDateKey(dateKey);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const endRef = getDateKey(now) === dateKey ? now : dayEnd;

  const smokes = (logs[dateKey] ?? [])
    .map((ts) => new Date(ts))
    .filter((d) => !Number.isNaN(d.getTime()) && d >= dayStart && d <= endRef)
    .sort((a, b) => a.getTime() - b.getTime());

  let pointer = dayStart;
  let best = 0;
  let bestStart: Date | null = null;
  let bestEnd: Date | null = null;

  smokes.forEach((smokeAt) => {
    const minutes = getAwakeInterval(pointer, smokeAt, settings.sleepStart ?? null, settings.sleepEnd ?? null);
    if (minutes > best) {
      best = minutes;
      bestStart = new Date(pointer);
      bestEnd = new Date(smokeAt);
    }
    pointer = smokeAt;
  });

  const lastMinutes = getAwakeInterval(pointer, endRef, settings.sleepStart ?? null, settings.sleepEnd ?? null);
  if (lastMinutes > best) {
    best = lastMinutes;
    bestStart = new Date(pointer);
    bestEnd = new Date(endRef);
  }

  return {
    dateKey,
    maxGapMinutes: best,
    maxGapStartTs: bestStart ? bestStart.toISOString() : null,
    maxGapEndTs: bestEnd ? bestEnd.toISOString() : null,
  };
}

function buildSummaryMap(logs: Logs, settings: Settings, isPremium: boolean, now: Date): Record<string, DailyGapSummary> {
  const out: Record<string, DailyGapSummary> = {};
  Object.keys(logs).forEach((dateKey) => {
    if (isDateLocked(dateKey, isPremium)) return;
    out[dateKey] = buildDaySummary(dateKey, logs, now, settings);
  });
  return out;
}

function getPeriodKeys(
  range: IntervalRange,
  todayKey: string,
  baseDate: Date,
  summaryMap: Record<string, DailyGapSummary>,
): string[] {
  if (range === 'recent7') {
    return Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, i - 6));
  }

  if (range === 'week') {
    return getWeekDateKeys(baseDate);
  }

  if (range === 'month') {
    return getMonthDateKeys(baseDate);
  }

  const keys = Object.keys(summaryMap).sort();
  return keys.length > 0 ? keys : [todayKey];
}

function buildTrend(values: number[]): Array<number | null> {
  return values.map((_, i) => {
    const start = Math.max(0, i - 6);
    const window = values.slice(start, i + 1);
    const avg = window.reduce((sum, value) => sum + value, 0) / window.length;
    return Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;
  });
}

function getAllowedMarkers(range: IntervalRange): Set<IntervalMarker> {
  if (range === 'week') return new Set<IntervalMarker>(['PB', 'OVER_LAST_WEEK']);
  if (range === 'month') return new Set<IntervalMarker>(['PB', 'OVER_LAST_MONTH']);
  return new Set<IntervalMarker>(['PB']);
}

function buildMarkers(
  dateKey: string,
  range: IntervalRange,
  summaryMap: Record<string, DailyGapSummary>,
  sortedKeys: string[],
): IntervalMarker[] {
  const current = summaryMap[dateKey];
  if (!current || current.maxGapMinutes <= 0) return [];

  const allowed = getAllowedMarkers(range);
  const markers: IntervalMarker[] = [];
  const pastKeys = sortedKeys.filter((key) => key < dateKey && summaryMap[key]);

  if (allowed.has('PB') && pastKeys.length > 0) {
    const best = getMaxByKeys(summaryMap, pastKeys);
    if (current.maxGapMinutes > best) markers.push('PB');
  }

  if (allowed.has('OVER_LAST_WEEK')) {
    const lastWeekKeys = getWeekDateKeys(parseDateKey(dateKey)).map((key) => shiftDateKey(key, -7));
    if (hasAnySummary(summaryMap, lastWeekKeys)) {
      const best = getMaxByKeys(summaryMap, lastWeekKeys);
      if (current.maxGapMinutes > best) markers.push('OVER_LAST_WEEK');
    }
  }

  if (allowed.has('OVER_LAST_MONTH')) {
    const lastMonthKeys = getLastMonthDateKeys(parseDateKey(dateKey));
    if (hasAnySummary(summaryMap, lastMonthKeys)) {
      const best = getMaxByKeys(summaryMap, lastMonthKeys);
      if (current.maxGapMinutes > best) markers.push('OVER_LAST_MONTH');
    }
  }

  return markers;
}

function buildSummaryText(
  range: IntervalRange,
  now: Date,
  baseDate: Date,
  summaryMap: Record<string, DailyGapSummary>,
): Pick<IntervalStoryState, 'summaryTitle' | 'summaryValue' | 'summaryDiffText' | 'periodLabel' | 'canNavigate'> {
  if (range === 'week') {
    const currentKeys = getWeekDateKeys(baseDate);
    const prevKeys = currentKeys.map((key) => shiftDateKey(key, -7));
    const currentBest = getMaxByKeys(summaryMap, currentKeys);
    const hasPrev = hasAnySummary(summaryMap, prevKeys);
    const prevBest = getMaxByKeys(summaryMap, prevKeys);
    return {
      summaryTitle: '今週の最長',
      summaryValue: formatCompactHM(currentBest),
      summaryDiffText: `先週比：${hasPrev ? formatDiffMinutes(currentBest - prevBest) : '—'}`,
      periodLabel: formatWeekLabel(baseDate),
      canNavigate: true,
    };
  }

  if (range === 'month') {
    const currentKeys = getMonthDateKeys(baseDate);
    const prevKeys = getLastMonthDateKeys(baseDate);
    const currentBest = getMaxByKeys(summaryMap, currentKeys);
    const hasPrev = hasAnySummary(summaryMap, prevKeys);
    const prevBest = getMaxByKeys(summaryMap, prevKeys);
    return {
      summaryTitle: '今月の最長',
      summaryValue: formatCompactHM(currentBest),
      summaryDiffText: `先月比：${hasPrev ? formatDiffMinutes(currentBest - prevBest) : '—'}`,
      periodLabel: formatMonthLabel(baseDate),
      canNavigate: true,
    };
  }

  if (range === 'recent7') {
    const todayKey = getDateKey(now);
    const currentKeys = Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, i - 6));
    const prevKeys = Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, i - 13));
    const currentBest = getMaxByKeys(summaryMap, currentKeys);
    const hasPrev = hasAnySummary(summaryMap, prevKeys);
    const prevBest = getMaxByKeys(summaryMap, prevKeys);
    return {
      summaryTitle: '直近7日の最長間隔',
      summaryValue: formatCompactHM(currentBest),
      summaryDiffText: `前7日比：${hasPrev ? formatDiffMinutes(currentBest - prevBest) : '—'}`,
      periodLabel: '直近7日',
      canNavigate: false,
    };
  }

  const keys = Object.keys(summaryMap).sort();
  const best = getMaxByKeys(summaryMap, keys);
  return {
    summaryTitle: '全期間の最長',
    summaryValue: formatCompactHM(best),
    summaryDiffText: `記録日数：${keys.length}日`,
    periodLabel: formatAllLabel(summaryMap),
    canNavigate: false,
  };
}

function markerLabel(marker: IntervalMarker): string {
  if (marker === 'PB') return '★';
  if (marker === 'OVER_LAST_WEEK') return '▲';
  return '◆';
}

export function buildIntervalStoryState(
  range: IntervalRange,
  logs: Logs,
  settings: Settings,
  isPremium: boolean,
  now: Date,
  baseDate: Date,
): IntervalStoryState {
  const summaryMap = buildSummaryMap(logs, settings, isPremium, now);
  const todayKey = getDateKey(now);
  const periodKeys = getPeriodKeys(range, todayKey, baseDate, summaryMap);
  const values = periodKeys.map((key) => summaryMap[key]?.maxGapMinutes ?? 0);
  const trend = buildTrend(values);
  const recordedValues = periodKeys
    .map((key) => summaryMap[key]?.maxGapMinutes)
    .filter((value): value is number => value !== undefined);
  const periodMin = recordedValues.length > 0 ? Math.min(...recordedValues) : 0;
  const periodAvg = recordedValues.length > 0 ? recordedValues.reduce((sum, value) => sum + value, 0) / recordedValues.length : 0;
  const allSummaryKeys = Object.keys(summaryMap).sort();

  const points: IntervalPoint[] = periodKeys.map((key, index) => ({
    dateKey: key,
    label: key.slice(5),
    maxGapMinutes: values[index] ?? 0,
    trendMinutes: trend[index] ?? null,
    markers: buildMarkers(key, range, summaryMap, allSummaryKeys),
  }));

  const hasLockedData = !isPremium && Object.keys(logs).some((key) => isDateLocked(key, false));
  const summaryText = buildSummaryText(range, now, baseDate, summaryMap);

  return {
    points,
    showPremiumNotice: hasLockedData,
    recent7MinText: formatCompactHM(periodMin),
    recent7AvgText: formatCompactHM(periodAvg),
    ...summaryText,
  };
}

export function markerSymbols(markers: IntervalMarker[]): string {
  return markers.map(markerLabel).join('');
}

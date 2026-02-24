import { getDateKey, getMonthDateKeys, getWeekDateKeys, isDateLocked, moveBaseDate, parseDateKey } from './date';
import type { GraphType, Logs, RangeType } from '../types/app';

export type ChartSection = {
  title: string;
  labels: string[];
  values: number[];
  yMax: number;
  scrollable: boolean;
};

export type StatsSummary = {
  total: number;
  max: number;
  maxDate: string;
  min: number;
  minDate: string;
  showPrev: boolean;
  prevTotal: number | null;
  diff: number | null;
  percent: string | null;
};

export type StatsViewState = {
  title: string;
  label: string;
  chart: ChartSection;
  summary: StatsSummary;
  showWeekdayButton: boolean;
  showNavigation: boolean;
};

export function normalizeGraphType(graphType: GraphType, rangeType: RangeType): GraphType {
  const allowed = rangeType === 'week' ? ['primary', 'hourly'] : ['primary', 'hourly', 'weekday'];
  return allowed.includes(graphType) ? graphType : 'primary';
}

function getPeriodDateKeys(rangeType: RangeType, baseDate: Date, logs: Logs, premium: boolean): string[] {
  if (rangeType === 'all') {
    return Object.keys(logs).sort().filter((k) => !isDateLocked(k, premium));
  }
  const keys = rangeType === 'week' ? getWeekDateKeys(baseDate) : getMonthDateKeys(baseDate);
  return keys.filter((k) => !isDateLocked(k, premium));
}

function getRecordedKeys(logs: Logs, keys: string[]) {
  return keys.filter((k) => Object.prototype.hasOwnProperty.call(logs, k));
}

function shiftDateKeys(dateKeys: string[], offsetDays: number): string[] {
  return dateKeys.map((k) => {
    const d = parseDateKey(k);
    d.setDate(d.getDate() + offsetDays);
    return getDateKey(d);
  });
}

function getPrevRecordedDateKeys(rangeType: RangeType, baseDate: Date, logs: Logs, current: string[]) {
  if (rangeType === 'all') return [];
  const prevKeys = rangeType === 'week' ? shiftDateKeys(current, -7) : getMonthDateKeys(moveBaseDate(baseDate, 'month', -1));
  return getRecordedKeys(logs, prevKeys);
}

function buildSummary(logs: Logs, recorded: string[], prev: string[], showPrev: boolean): StatsSummary {
  const values = recorded.map((date) => ({ date, count: logs[date]?.length ?? 0 }));
  const total = values.reduce((sum, item) => sum + item.count, 0);
  const maxObj = values.reduce((a, b) => (b.count > a.count ? b : a), { date: '', count: 0 });
  const minObj = values.reduce((a, b) => (b.count < a.count ? b : a), {
    date: '',
    count: Number.POSITIVE_INFINITY,
  });
  const prevTotal = prev.reduce((sum, date) => sum + (logs[date]?.length ?? 0), 0);
  const diff = total - prevTotal;
  const percent = prevTotal > 0 ? ((diff / prevTotal) * 100).toFixed(1) : null;
  return {
    total,
    max: values.length ? maxObj.count : 0,
    maxDate: values.length ? maxObj.date : '',
    min: values.length ? minObj.count : 0,
    minDate: values.length ? minObj.date : '',
    showPrev,
    prevTotal: showPrev ? prevTotal : null,
    diff: showPrev ? diff : null,
    percent: showPrev ? percent : null,
  };
}

function buildChartSection(title: string, labels: string[], values: number[], scrollable: boolean): ChartSection {
  const max = Math.max(0, ...values);
  return {
    title,
    labels,
    values,
    yMax: max <= 5 ? 5 : Math.ceil(max + 1),
    scrollable,
  };
}

function addMonths(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthKeys(startMonth: string, endMonth: string): string[] {
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, 1);
  const end = new Date(ey, em - 1, 1);
  const months: string[] = [];
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function buildPrimarySeries(rangeType: RangeType, periodKeys: string[], recordedKeys: string[], logs: Logs) {
  if (rangeType !== 'all') {
    const labels = periodKeys.map((d) => d.slice(5));
    const values = periodKeys.map((d) => logs[d]?.length ?? 0);
    return buildChartSection('日別本数', labels, values, false);
  }

  const monthMap: Record<string, number> = {};
  recordedKeys.forEach((date) => {
    const month = date.slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + (logs[date]?.length ?? 0);
  });

  const monthsWithData = Object.keys(monthMap).sort();
  const currentMonth = getDateKey(new Date()).slice(0, 7);
  const minStartMonth = addMonths(currentMonth, -11);
  const startMonth = monthsWithData.length > 0 && monthsWithData[0] < minStartMonth ? monthsWithData[0] : minStartMonth;
  const labels = buildMonthKeys(startMonth, currentMonth);
  const values = labels.map((m) => monthMap[m] ?? 0);
  return buildChartSection('月別本数', labels, values, labels.length > 12);
}

function buildHourlySeries(recorded: string[], logs: Logs, average: boolean) {
  const totals = new Array(24).fill(0);
  recorded.forEach((date) => {
    (logs[date] || []).forEach((ts) => {
      totals[new Date(ts).getHours()] += 1;
    });
  });
  const days = recorded.length;
  const values = totals.map((v) => (average && days > 0 ? Math.round((v / days) * 10) / 10 : v));
  return values;
}

function buildWeekdaySeries(recorded: string[], logs: Logs) {
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  recorded.forEach((date) => {
    const day = parseDateKey(date).getDay();
    totals[day] += logs[date]?.length ?? 0;
    counts[day] += 1;
  });
  return totals.map((sum, i) => (counts[i] > 0 ? Math.round((sum / counts[i]) * 10) / 10 : 0));
}

function formatWeekLabel(baseDate: Date): string {
  const weekKeys = getWeekDateKeys(baseDate);
  const start = weekKeys[0] ?? getDateKey(baseDate);
  return `${start.replaceAll('-', '/')}週`;
}

function formatMonthLabel(baseDate: Date): string {
  return `${baseDate.getFullYear()}/${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
}

function formatAllLabel(recordedDateKeys: string[]): string {
  if (recordedDateKeys.length === 0) return '記録なし';
  const first = recordedDateKeys[0]?.slice(0, 7).replace('-', '/');
  const last = recordedDateKeys[recordedDateKeys.length - 1]?.slice(0, 7).replace('-', '/');
  if (!first || !last) return '記録なし';
  return first === last ? first : `${first}〜${last}`;
}

export function buildStatsState(rangeType: RangeType, graphType: GraphType, baseDate: Date, logs: Logs, premium: boolean): StatsViewState {
  const periodDateKeys = getPeriodDateKeys(rangeType, baseDate, logs, premium);
  const recordedDateKeys = getRecordedKeys(logs, periodDateKeys);
  const prevRecordedDateKeys = getPrevRecordedDateKeys(rangeType, baseDate, logs, periodDateKeys);

  const summary = buildSummary(logs, recordedDateKeys, prevRecordedDateKeys, rangeType !== 'all');
  const normalizedGraph = normalizeGraphType(graphType, rangeType);

  const primary = buildPrimarySeries(rangeType, periodDateKeys, recordedDateKeys, logs);
  const hourlyAverage = rangeType === 'week' ? false : true;
  const hourlyValues = buildHourlySeries(recordedDateKeys, logs, hourlyAverage);
  const weekdayValues = buildWeekdaySeries(recordedDateKeys, logs);

  const charts: Record<GraphType, ChartSection> = {
    primary,
    hourly: buildChartSection(hourlyAverage ? '時間帯別本数（平均）' : '時間帯別本数（合計）', Array.from({ length: 24 }, (_, i) => `${i}時`), hourlyValues, false),
    weekday: buildChartSection('曜日別本数（平均）', ['日', '月', '火', '水', '木', '金', '土'], weekdayValues, false),
  };

  const label = rangeType === 'week'
    ? formatWeekLabel(baseDate)
    : rangeType === 'month'
      ? formatMonthLabel(baseDate)
      : formatAllLabel(recordedDateKeys);

  return {
    title: charts[normalizedGraph].title,
    label,
    chart: charts[normalizedGraph],
    summary,
    showWeekdayButton: rangeType !== 'week',
    showNavigation: rangeType !== 'all',
  };
}

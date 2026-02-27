import { useEffect, useMemo, useState } from 'react';
import { FREE_LIMIT_DAYS, getDateKey, getMonthDateKeys, getWeekDateKeys, isDateLocked, parseDateKey } from '../domain/date';
import { getAwakeInterval } from './useAwakeInterval';
import type { Logs, Settings } from '../types/app';

export type AchievementKind = 'PB' | 'OVER_LAST_MONTH' | 'OVER_LAST_WEEK' | 'OVER_THIS_WEEK';

export type Achievement = {
  kind: AchievementKind;
  label: string;
  occurredAt: string;
  dateKey?: string;
};

export type Target = {
  label: string;
  remainingMinutes: number;
  targetMinutes: number;
};

export type SmokingIntervalState = {
  bestMinutes: number;
  todayLongestMinutes: number;
  currentMinutes: number;
  nextTarget: Target | null;
  isInitialState: boolean;
  achievements: Achievement[];
};

type AchievementState = {
  dateKey: string;
  items: Achievement[];
};

const MAX_ACHIEVEMENTS = 3;

const ACHIEVEMENT_LABELS: Record<AchievementKind, string> = {
  PB: '★ 自己ベスト更新',
  OVER_LAST_MONTH: '◆ 先月最高を更新',
  OVER_LAST_WEEK: '▲ 先週最高を更新',
  OVER_THIS_WEEK: '✔ 今週最高を更新',
};

const ACHIEVEMENT_PRIORITY: Record<AchievementKind, number> = {
  PB: 4,
  OVER_LAST_MONTH: 3,
  OVER_LAST_WEEK: 2,
  OVER_THIS_WEEK: 1,
};

function getSortedSmokeDates(logs: Logs): Date[] {
  const out: Date[] = [];
  Object.values(logs).forEach((times) => {
    times.forEach((ts) => {
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) out.push(d);
    });
  });
  out.sort((a, b) => a.getTime() - b.getTime());
  return out;
}

export function filterLogsForPlan(smokes: Date[], now: Date, isPremium: boolean): Date[] {
  if (isPremium) return smokes;
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setDate(cutoff.getDate() - FREE_LIMIT_DAYS);
  return smokes.filter((d) => d >= cutoff);
}

function getBestFromHistory(smokes: Date[], settings: Settings): number {
  if (smokes.length < 2) return 0;
  let best = 0;
  for (let i = 1; i < smokes.length; i += 1) {
    best = Math.max(best, getAwakeInterval(smokes[i - 1], smokes[i], settings.sleepStart ?? null, settings.sleepEnd ?? null));
  }
  return best;
}

function getTodayLongest(smokes: Date[], now: Date, settings: Settings): number {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todaySmokes = smokes.filter((d) => d >= dayStart && d <= now);
  let pointer = dayStart;
  let best = 0;

  todaySmokes.forEach((smokeAt) => {
    best = Math.max(best, getAwakeInterval(pointer, smokeAt, settings.sleepStart ?? null, settings.sleepEnd ?? null));
    pointer = smokeAt;
  });

  best = Math.max(best, getAwakeInterval(pointer, now, settings.sleepStart ?? null, settings.sleepEnd ?? null));
  return best;
}

export function formatHoursMinutes(minutes: number): string {
  const safe = Math.max(0, minutes);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}時間${String(mins).padStart(2, '0')}分`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return getDateKey(d);
}

function getDayLongestFromDateKey(logs: Logs, dateKey: string, now: Date, settings: Settings): number {
  const start = parseDateKey(dateKey);
  const startTime = start.getTime();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayKey = getDateKey(now);
  const endRef = dateKey === todayKey ? now : end;

  const smokes = (logs[dateKey] ?? [])
    .map((ts) => new Date(ts))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= startTime && d <= endRef)
    .sort((a, b) => a.getTime() - b.getTime());

  let pointer = start;
  let best = 0;

  smokes.forEach((smokeAt) => {
    best = Math.max(best, getAwakeInterval(pointer, smokeAt, settings.sleepStart ?? null, settings.sleepEnd ?? null));
    pointer = smokeAt;
  });

  best = Math.max(best, getAwakeInterval(pointer, endRef, settings.sleepStart ?? null, settings.sleepEnd ?? null));
  return best;
}

function getMaxForKeys(dailyLongest: Record<string, number>, keys: string[]): number {
  return keys.reduce((max, key) => Math.max(max, dailyLongest[key] ?? 0), 0);
}

function getLastMonthDateKeys(now: Date): string[] {
  const prevMonthBaseDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return getMonthDateKeys(prevMonthBaseDate);
}

function getRecent7DateKeys(todayKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, i - 6));
}

function getAchievementKindsFromThresholds(
  todayLongestMinutes: number,
  thresholds: Record<AchievementKind, { value: number; enabled: boolean }>,
): AchievementKind[] {
  return (Object.keys(thresholds) as AchievementKind[]).filter((kind) => thresholds[kind].enabled && todayLongestMinutes > thresholds[kind].value);
}

function compareAchievements(a: Achievement, b: Achievement): number {
  const priorityDiff = ACHIEVEMENT_PRIORITY[b.kind] - ACHIEVEMENT_PRIORITY[a.kind];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
}

function trimAchievements(items: Achievement[]): Achievement[] {
  const next = [...items];
  while (next.length > MAX_ACHIEVEMENTS) {
    let removableIndex = 0;
    for (let i = 1; i < next.length; i += 1) {
      const cur = next[i];
      const removable = next[removableIndex];
      const curPriority = ACHIEVEMENT_PRIORITY[cur.kind];
      const removablePriority = ACHIEVEMENT_PRIORITY[removable.kind];
      if (curPriority < removablePriority) {
        removableIndex = i;
        continue;
      }
      if (curPriority === removablePriority && new Date(cur.occurredAt) < new Date(removable.occurredAt)) {
        removableIndex = i;
      }
    }
    next.splice(removableIndex, 1);
  }
  return next;
}

function buildAchievement(kind: AchievementKind, occurredAt: string, dateKey: string): Achievement {
  return {
    kind,
    label: ACHIEVEMENT_LABELS[kind],
    occurredAt,
    dateKey,
  };
}

function getNextTarget(todayLongestMinutes: number, candidates: Array<{ label: string; value: number }>): Target | null {
  let selected: Target | null = null;
  candidates.forEach((candidate) => {
    const remainingMinutes = candidate.value - todayLongestMinutes;
    if (remainingMinutes <= 0) return;
    if (!selected || remainingMinutes < selected.remainingMinutes) {
      selected = { label: candidate.label, remainingMinutes, targetMinutes: candidate.value };
    }
  });
  return selected;
}

export function useSmokingIntervals(logs: Logs, settings: Settings, isPremium: boolean): SmokingIntervalState {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const todayKey = getDateKey(now);
  const [achievementState, setAchievementState] = useState<AchievementState>({
    dateKey: todayKey,
    items: [],
  });

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    const smokes = filterLogsForPlan(getSortedSmokeDates(logs), now, isPremium);
    const lastSmoke = smokes[smokes.length - 1] ?? null;
    const currentMinutes = lastSmoke ? getAwakeInterval(lastSmoke, now, settings.sleepStart ?? null, settings.sleepEnd ?? null) : 0;
    const historicalBestMinutes = getBestFromHistory(smokes, settings);
    const todayLongestMinutes = getTodayLongest(smokes, now, settings);
    const bestMinutes = Math.max(historicalBestMinutes, currentMinutes);
    const dailyLongestByDate: Record<string, number> = {};
    const availableDateKeys = Object.keys(logs).filter((dateKey) => !isDateLocked(dateKey, isPremium));
    availableDateKeys.forEach((dateKey) => {
      if (isDateLocked(dateKey, isPremium)) return;
      dailyLongestByDate[dateKey] = getDayLongestFromDateKey(logs, dateKey, now, settings);
    });
    dailyLongestByDate[todayKey] = todayLongestMinutes;

    const thisWeekKeys = getWeekDateKeys(now);
    const lastWeekKeys = thisWeekKeys.map((dateKey) => shiftDateKey(dateKey, -7));
    const lastMonthKeys = getLastMonthDateKeys(now);
    const recent7Keys = getRecent7DateKeys(todayKey);

    const thisWeekBest = getMaxForKeys(dailyLongestByDate, thisWeekKeys);
    const thisWeekBestBeforeToday = getMaxForKeys(
      dailyLongestByDate,
      thisWeekKeys.filter((dateKey) => dateKey !== todayKey),
    );
    const lastWeekBest = getMaxForKeys(dailyLongestByDate, lastWeekKeys);
    const lastMonthBest = getMaxForKeys(dailyLongestByDate, lastMonthKeys);
    const recent7Best = getMaxForKeys(dailyLongestByDate, recent7Keys);

    const hasLastWeekData = lastWeekKeys.some((dateKey) => availableDateKeys.includes(dateKey));
    const hasLastMonthData = lastMonthKeys.some((dateKey) => availableDateKeys.includes(dateKey));
    const hasThisWeekBeforeTodayData = thisWeekKeys
      .filter((dateKey) => dateKey !== todayKey)
      .some((dateKey) => availableDateKeys.includes(dateKey));
    const pastDateKeys = availableDateKeys.filter((dateKey) => dateKey !== todayKey);
    const hasPastData = pastDateKeys.length > 0;
    const pastBestMinutes = hasPastData ? getMaxForKeys(dailyLongestByDate, pastDateKeys) : 0;
    const isInitialState = availableDateKeys.length === 0;

    const nextTarget = isInitialState
      ? null
      : getNextTarget(todayLongestMinutes, [
          { label: '今週最高', value: thisWeekBest },
          { label: '先週最高', value: lastWeekBest },
          { label: '先月最高', value: lastMonthBest },
          { label: '直近7日最高', value: recent7Best },
          { label: '自己ベスト', value: historicalBestMinutes },
        ]);

    const achievementThresholds: Record<AchievementKind, { value: number; enabled: boolean }> = {
      PB: { value: pastBestMinutes, enabled: hasPastData },
      OVER_LAST_MONTH: { value: lastMonthBest, enabled: hasLastMonthData },
      OVER_LAST_WEEK: { value: lastWeekBest, enabled: hasLastWeekData },
      OVER_THIS_WEEK: { value: thisWeekBestBeforeToday, enabled: hasThisWeekBeforeTodayData },
    };

    return {
      currentMinutes,
      historicalBestMinutes,
      todayLongestMinutes,
      bestMinutes,
      nextTarget,
      isInitialState,
      achievementThresholds,
    };
  }, [logs, settings, now, isPremium]);

  useEffect(() => {
    const nowISO = now.toISOString();
    const achievedKinds = getAchievementKindsFromThresholds(computed.todayLongestMinutes, computed.achievementThresholds);
    setAchievementState((prev) => {
      let nextState = prev;
      if (prev.dateKey !== todayKey) {
        const seeded = trimAchievements(
          achievedKinds.map((kind) => buildAchievement(kind, nowISO, todayKey)),
        );
        nextState = { dateKey: todayKey, items: seeded };
      }

      let changed = nextState !== prev;
      let nextItems = nextState.items;
      achievedKinds.forEach((kind) => {
        if (nextItems.some((item) => item.kind === kind)) return;
        nextItems = trimAchievements([...nextItems, buildAchievement(kind, nowISO, todayKey)]);
        changed = true;
      });

      if (!changed) return prev;
      return { dateKey: todayKey, items: nextItems };
    });
  }, [computed.achievementThresholds, computed.todayLongestMinutes, now, todayKey]);

  const achievements = useMemo(() => {
    if (achievementState.dateKey !== todayKey) return [];
    return [...achievementState.items].sort(compareAchievements);
  }, [achievementState, todayKey]);

  return {
    bestMinutes: computed.bestMinutes,
    todayLongestMinutes: computed.todayLongestMinutes,
    currentMinutes: computed.currentMinutes,
    nextTarget: computed.nextTarget,
    isInitialState: computed.isInitialState,
    achievements,
  };
}

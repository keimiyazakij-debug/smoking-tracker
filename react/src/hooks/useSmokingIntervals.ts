import { useEffect, useMemo, useState } from 'react';
import { FREE_LIMIT_DAYS, getDateKey } from '../domain/date';
import { getAwakeInterval } from './useAwakeInterval';
import type { Logs, Settings } from '../types/app';

type BestUpdateState = {
  dateKey: string;
  minutes: number;
};

export type SmokingIntervalState = {
  bestMinutes: number;
  todayLongestMinutes: number;
  currentMinutes: number;
  message: string;
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

export function useSmokingIntervals(logs: Logs, settings: Settings, isPremium: boolean): SmokingIntervalState {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bestUpdate, setBestUpdate] = useState<BestUpdateState | null>(null);
  const [message, setMessage] = useState('');
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const todayKey = getDateKey(now);

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
    return { currentMinutes, historicalBestMinutes, todayLongestMinutes, bestMinutes };
  }, [logs, settings, now, isPremium]);

  useEffect(() => {
    if (bestUpdate && bestUpdate.dateKey !== todayKey) {
      setBestUpdate(null);
    }
  }, [bestUpdate, todayKey]);

  useEffect(() => {
    if (computed.currentMinutes <= computed.historicalBestMinutes) return;
    const updatedMinutes = computed.currentMinutes - computed.historicalBestMinutes;
    setBestUpdate((prev) => {
      if (prev && prev.dateKey === todayKey && prev.minutes >= updatedMinutes) return prev;
      return { dateKey: todayKey, minutes: updatedMinutes };
    });
  }, [computed.currentMinutes, computed.historicalBestMinutes, todayKey]);

  useEffect(() => {
    if (bestUpdate && bestUpdate.dateKey === todayKey) {
      setMessage(`自己ベストを${bestUpdate.minutes}分更新しました`);
      return;
    }
    const remaining = computed.bestMinutes - computed.currentMinutes;
    if (remaining > 0 && remaining <= 60) {
      setMessage(`あと${remaining}分で自己ベスト`);
      return;
    }
    setMessage('');
  }, [bestUpdate, todayKey, computed.bestMinutes, computed.currentMinutes]);

  return {
    bestMinutes: computed.bestMinutes,
    todayLongestMinutes: computed.todayLongestMinutes,
    currentMinutes: computed.currentMinutes,
    message,
  };
}

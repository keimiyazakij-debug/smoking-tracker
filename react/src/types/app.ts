export type Logs = Record<string, string[]>;
export type DailyMemos = Record<string, string>;
export type RangeType = 'week' | 'month' | 'all';
export type GraphType = 'primary' | 'hourly' | 'weekday';

export type Settings = {
  dailyTarget: number;
  calendarEvaluation: 'target';
  sleepStart?: string | null;
  sleepEnd?: string | null;
};

export type PersistedState = {
  logs: Logs;
  settings: Settings;
  memos: DailyMemos;
  isPremium: boolean;
};

export type AppState = PersistedState;

export type AppAction =
  | { type: 'ADD_SMOKE'; atISO?: string }
  | { type: 'UNDO_LAST_SMOKE'; dateKey?: string }
  | { type: 'MARK_SUCCESS'; dateKey: string }
  | { type: 'SET_DAILY_TARGET'; dailyTarget: number }
  | { type: 'SET_SLEEP_HOURS'; sleepStart: string | null; sleepEnd: string | null }
  | { type: 'SET_LOGS'; logs: Logs }
  | { type: 'SET_MEMO'; dateKey: string; memo: string }
  | { type: 'SET_PREMIUM'; isPremium: boolean };

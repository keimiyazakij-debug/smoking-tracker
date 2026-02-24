import { getDateKey } from './date';

export type Logs = Record<string, string[]>;

export function addSmoke(logs: Logs, at: Date): Logs {
  const dateKey = getDateKey(at);
  const current = logs[dateKey] ?? [];
  return {
    ...logs,
    [dateKey]: [...current, at.toISOString()],
  };
}

export function undoLastSmoke(logs: Logs, dateKey: string): Logs {
  const current = logs[dateKey] ?? [];
  if (current.length === 0) return logs;
  const next = current.slice(0, -1);
  const nextLogs = { ...logs };
  if (next.length === 0) delete nextLogs[dateKey];
  else nextLogs[dateKey] = next;
  return nextLogs;
}

export function markSuccess(logs: Logs, dateKey: string): Logs {
  return {
    ...logs,
    [dateKey]: [],
  };
}

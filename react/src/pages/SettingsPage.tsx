import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { SettingsHeader } from '../components/settings/SettingsHeader';
import { TargetSettingsCard } from '../components/settings/TargetSettingsCard';
import { SleepSettingsCard } from '../components/settings/SleepSettingsCard';
import { PremiumSettingsCard } from '../components/settings/PremiumSettingsCard';
import { DataManagementCard } from '../components/settings/DataManagementCard';
import { storage } from '../platform/storage';

export function isDevModeEnabled(host: string, devModeFlag: string | null): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.includes('debug.github.io') || devModeFlag === 'true';
}

export function SettingsPage() {
  const { state: logsState, dispatch: logsDispatch } = useLogsContext();
  const { state: settingsState, dispatch: settingsDispatch } = useSettingsContext();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const isDevMode = useMemo(() => {
    const host = window.location.hostname;
    return isDevModeEnabled(host, storage.getItem('dev_mode'));
  }, []);

  const parseObj = <T,>(value: unknown): T | null => {
    if (!value) return null;
    if (typeof value === 'object' && !Array.isArray(value)) return value as T;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as T;
      } catch {
        return null;
      }
    }
    return null;
  };

  const normalizeImport = (
    raw: unknown,
  ): {
    logs?: Record<string, string[]>;
    settings?: { dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null };
    memos?: Record<string, string>;
    isPremium?: boolean;
  } | null => {
    const obj = parseObj<Record<string, unknown>>(raw);
    if (!obj) return null;
    const directState = {
      logs: parseObj<Record<string, string[]>>(obj.logs),
      settings: parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(obj.settings),
      memos: parseObj<Record<string, string>>(obj.memos),
      isPremium: typeof obj.isPremium === 'boolean' ? obj.isPremium : undefined,
    };

    const nestedStateObj = parseObj<{
      logs?: Record<string, string[]>;
      settings?: { dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null };
      memos?: Record<string, string>;
      isPremium?: boolean;
    }>(obj.smoking_tracker_react_state);
    const nestedState = nestedStateObj
        ? {
          logs: parseObj<Record<string, string[]>>(nestedStateObj.logs),
          settings: parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(nestedStateObj.settings),
          memos: parseObj<Record<string, string>>(nestedStateObj.memos),
          isPremium: typeof nestedStateObj.isPremium === 'boolean' ? nestedStateObj.isPremium : undefined,
        }
      : null;

    const legacyLogs = parseObj<Record<string, string[]>>(obj.dailyLogs);
    const legacySettings = parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(obj.settings);
    const legacyMemos = parseObj<Record<string, string>>(obj.memos);
    const legacyPremium =
      typeof obj.debug_isPremium === 'string' ? obj.debug_isPremium === 'true' : typeof obj.isPremium === 'boolean' ? obj.isPremium : undefined;

    const merged = {
      logs: directState.logs || nestedState?.logs || legacyLogs || undefined,
      settings: directState.settings || nestedState?.settings || legacySettings || undefined,
      memos: directState.memos || nestedState?.memos || legacyMemos || undefined,
      isPremium:
        directState.isPremium !== undefined
          ? directState.isPremium
          : nestedState?.isPremium !== undefined
            ? nestedState.isPremium
            : legacyPremium,
    };

    if (!merged.logs && !merged.settings && !merged.memos && merged.isPremium === undefined) return null;
    return merged;
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ logs: logsState.logs, settings: settingsState.settings, memos: logsState.memos }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smoking-tracker-backup-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target as HTMLInputElement;
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = normalizeImport(JSON.parse(text));
      if (!parsed) {
        setMessage('ファイル形式が正しくありません。');
        inputEl.value = '';
        return;
      }
      const ok = window.confirm('現在のデータを上書きします。よろしいですか？');
      if (!ok) return;
      if (parsed.logs) {
        logsDispatch({ type: 'SET_LOGS', logs: parsed.logs });
      }
      if (parsed.settings?.dailyTarget != null) {
        settingsDispatch({ type: 'SET_DAILY_TARGET', dailyTarget: Number(parsed.settings.dailyTarget || 0) });
      }
      if (parsed.settings) {
        settingsDispatch({
          type: 'SET_SLEEP_HOURS',
          sleepStart: parsed.settings.sleepStart ?? null,
          sleepEnd: parsed.settings.sleepEnd ?? null,
        });
      }
      if (typeof parsed.isPremium === 'boolean') {
        settingsDispatch({ type: 'SET_PREMIUM', isPremium: parsed.isPremium });
      }
      if (parsed.memos) {
        Object.keys(logsState.memos).forEach((k) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
        Object.entries(parsed.memos).forEach(([k, v]) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: v }));
      }
      setMessage('インポートが完了しました。');
    } catch {
      setMessage('ファイル形式が正しくありません。');
    }
    inputEl.value = '';
  };

  const handleReset = () => {
    if (!window.confirm('すべての記録をリセットします。よろしいですか？')) return;
    logsDispatch({ type: 'SET_LOGS', logs: {} });
    Object.keys(logsState.memos).forEach((k) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
    setMessage('全データをリセットしました。');
  };

  return (
    <div id="settings" className="tab active">
      <SettingsHeader title="設定" />
      <PremiumSettingsCard isPremium={settingsState.isPremium} onTogglePremium={(v) => settingsDispatch({ type: 'SET_PREMIUM', isPremium: v })} />
      <TargetSettingsCard dailyTarget={settingsState.settings.dailyTarget} onChangeTarget={(value) => settingsDispatch({ type: 'SET_DAILY_TARGET', dailyTarget: value })} />
      <SleepSettingsCard
        sleepStart={settingsState.settings.sleepStart ?? null}
        sleepEnd={settingsState.settings.sleepEnd ?? null}
        onChangeSleep={(sleepStart, sleepEnd) => settingsDispatch({ type: 'SET_SLEEP_HOURS', sleepStart, sleepEnd })}
      />
      <DataManagementCard
        fileRef={fileRef}
        message={message}
        onExport={handleExport}
        onImportClick={() => fileRef.current?.click()}
        onImportChange={handleImportChange}
        onReset={handleReset}
      />
      {isDevMode ? (
        <PremiumSettingsCard
          isPremium={settingsState.isPremium}
          onTogglePremium={(v) => settingsDispatch({ type: 'SET_PREMIUM', isPremium: v })}
          showPlan={false}
          showDebug
        />
      ) : null}
    </div>
  );
}

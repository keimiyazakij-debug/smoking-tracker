import { useMemo, useState } from 'react';
import type { Entitlement, ExportFileV1, PersistedState, PurchaseState, Settings } from '../types/app';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { isPremium as isPremiumSelector, resolveEntitlement, resolvePurchaseState } from '../state/settings/settingsSelectors';
import { exportTextFile, importTextFile, isFilePickCancelled } from '../platform/dataTransfer';
import { storage } from '../platform/storage';
import { SettingsPageView } from './settings/SettingsPageView';

export function isDevModeEnabled(host: string, devModeFlag: string | null): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.includes('debug.github.io') || devModeFlag === 'true';
}

function isEntitlement(value: unknown): value is Entitlement {
  return value === 'premium' || value === 'free';
}

function isPurchaseState(value: unknown): value is PurchaseState {
  return value === 'active' || value === 'inactive' || value === 'unknown';
}

export function SettingsPage() {
  const { state: logsState, dispatch: logsDispatch } = useLogsContext();
  const { state: settingsState, dispatch: settingsDispatch } = useSettingsContext();
  const isPremium = isPremiumSelector(settingsState);
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

  const getImportSource = (raw: unknown): Record<string, unknown> | null => {
    const obj = parseObj<Record<string, unknown>>(raw);
    if (!obj) return null;

    if (Object.prototype.hasOwnProperty.call(obj, 'schemaVersion')) {
      if (typeof obj.schemaVersion !== 'number') return null;
      const dataObj = parseObj<Record<string, unknown>>(obj.data);
      if (!dataObj) return null;
      const hasLogs = !!parseObj<Record<string, string[]>>(dataObj.logs);
      const hasSettings = !!parseObj<Settings>(dataObj.settings);
      if (!hasLogs || !hasSettings) return null;
      return dataObj;
    }

    return obj;
  };

  const normalizeImport = (
    raw: unknown,
  ): {
    logs?: Record<string, string[]>;
    settings?: { dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null };
    memos?: Record<string, string>;
    entitlement?: Entitlement;
    purchaseState?: PurchaseState;
  } | null => {
    const source = getImportSource(raw);
    if (!source) return null;
    const directState = {
      logs: parseObj<Record<string, string[]>>(source.logs),
      settings: parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(source.settings),
      memos: parseObj<Record<string, string>>(source.memos),
      entitlement: isEntitlement(source.entitlement) ? source.entitlement : undefined,
      purchaseState: isPurchaseState(source.purchaseState) ? source.purchaseState : undefined,
      isPremium: typeof source.isPremium === 'boolean' ? source.isPremium : undefined,
    };

    const nestedStateObj = parseObj<{
      logs?: Record<string, string[]>;
      settings?: { dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null };
      memos?: Record<string, string>;
      entitlement?: Entitlement;
      purchaseState?: PurchaseState;
      isPremium?: boolean;
    }>(source.smoking_tracker_react_state);
    const nestedState = nestedStateObj
        ? {
          logs: parseObj<Record<string, string[]>>(nestedStateObj.logs),
          settings: parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(nestedStateObj.settings),
          memos: parseObj<Record<string, string>>(nestedStateObj.memos),
          entitlement: isEntitlement(nestedStateObj.entitlement) ? nestedStateObj.entitlement : undefined,
          purchaseState: isPurchaseState(nestedStateObj.purchaseState) ? nestedStateObj.purchaseState : undefined,
          isPremium: typeof nestedStateObj.isPremium === 'boolean' ? nestedStateObj.isPremium : undefined,
        }
      : null;

    const legacyLogs = parseObj<Record<string, string[]>>(source.dailyLogs);
    const legacySettings = parseObj<{ dailyTarget?: number; calendarEvaluation?: 'target'; sleepStart?: string | null; sleepEnd?: string | null }>(source.settings);
    const legacyMemos = parseObj<Record<string, string>>(source.memos);
    const legacyPremium =
      typeof source.debug_isPremium === 'string' ? source.debug_isPremium === 'true' : typeof source.isPremium === 'boolean' ? source.isPremium : undefined;

    const merged = {
      logs: directState.logs || nestedState?.logs || legacyLogs || undefined,
      settings: directState.settings || nestedState?.settings || legacySettings || undefined,
      memos: directState.memos || nestedState?.memos || legacyMemos || undefined,
      entitlement: resolveEntitlement({
        entitlement: directState.entitlement ?? nestedState?.entitlement,
        isPremium:
          directState.isPremium !== undefined
            ? directState.isPremium
            : nestedState?.isPremium !== undefined
              ? nestedState.isPremium
              : legacyPremium,
      }),
      purchaseState: resolvePurchaseState({
        purchaseState: directState.purchaseState ?? nestedState?.purchaseState,
      }),
    };

    if (!merged.logs && !merged.settings && !merged.memos) return null;
    return merged;
  };

  const handleExport = async () => {
    const exportData: PersistedState = {
      logs: logsState.logs,
      settings: settingsState.settings,
      memos: logsState.memos,
      entitlement: settingsState.entitlement,
      purchaseState: settingsState.purchaseState,
    };
    const payload: ExportFileV1 = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: exportData,
    };

    await exportTextFile(
      `smoking-tracker-backup-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`,
      JSON.stringify(payload, null, 2),
    );
  };

  const handleImport = async () => {
    try {
      const text = await importTextFile('application/json,.json');
      const parsed = normalizeImport(JSON.parse(text));
      if (!parsed) {
        setMessage('ファイル形式が正しくありません。');
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
      settingsDispatch({ type: 'SET_ENTITLEMENT', entitlement: parsed.entitlement ?? 'free' });
      settingsDispatch({ type: 'SET_PURCHASE_STATE', purchaseState: parsed.purchaseState ?? 'unknown' });
      if (parsed.memos) {
        Object.keys(logsState.memos).forEach((k) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
        Object.entries(parsed.memos).forEach(([k, v]) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: v }));
      }
      setMessage('インポートが完了しました。');
    } catch (error) {
      if (isFilePickCancelled(error)) return;
      setMessage('ファイル形式が正しくありません。');
    }
  };

  const handleReset = () => {
    if (!window.confirm('すべての記録をリセットします。よろしいですか？')) return;
    logsDispatch({ type: 'SET_LOGS', logs: {} });
    Object.keys(logsState.memos).forEach((k) => logsDispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
    setMessage('全データをリセットしました。');
  };

  return (
    <SettingsPageView
      isPremium={isPremium}
      dailyTarget={settingsState.settings.dailyTarget}
      sleepStart={settingsState.settings.sleepStart ?? null}
      sleepEnd={settingsState.settings.sleepEnd ?? null}
      message={message}
      isDevMode={isDevMode}
      onTogglePremium={(value) => settingsDispatch({ type: 'SET_ENTITLEMENT', entitlement: value ? 'premium' : 'free' })}
      onChangeTarget={(value) => settingsDispatch({ type: 'SET_DAILY_TARGET', dailyTarget: value })}
      onChangeSleep={(sleepStart, sleepEnd) => settingsDispatch({ type: 'SET_SLEEP_HOURS', sleepStart, sleepEnd })}
      onExport={handleExport}
      onImport={handleImport}
      onReset={handleReset}
    />
  );
}

import { useMemo, useRef, useState } from 'react';
import { useAppContext } from '../state/AppContext';
import { TimeSelectField } from '../components/TimeSelectField';

export function SettingsPage() {
  const { state, dispatch } = useAppContext();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const isDevMode = useMemo(() => {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || window.localStorage.getItem('dev_mode') === 'true';
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

  return (
    <div id="settings" className="tab active">
      <h2 className="settings-page-title">設定</h2>
      <section id="settingsPremiumCard" className="settings-card settings-premium-card">
        <h3 className="settings-section-title">利用プラン</h3>
        <div className="settings-item settings-item-plan">
          <span className="settings-item-label">現在のプラン</span>
          <div id="planInfo" className="settings-plan-info">{state.isPremium ? 'プレミアム' : '無料プラン'}</div>
        </div>
      </section>

      <section className="settings-card">
        <h3 className="settings-section-title">目標設定</h3>
        <label className="settings-item settings-item-input">
          <span className="settings-item-label">1日の目標本数</span>
          <span className="settings-input-wrap">
            <input
              type="number"
              id="dailyTarget"
              className="setting-input"
              min={0}
              value={state.settings.dailyTarget}
              onChange={(e) => dispatch({ type: 'SET_DAILY_TARGET', dailyTarget: Number(e.target.value || 0) })}
            />
            <span className="settings-input-unit">本</span>
          </span>
        </label>
      </section>

      <section className="settings-card">
        <h3 className="settings-section-title">睡眠時間（間隔計算から除外）</h3>
        <label className="settings-item settings-item-input">
          <span className="settings-item-label">通常の就寝時刻</span>
          <span className="settings-input-wrap">
            <TimeSelectField
              id="sleepStart"
              value={state.settings.sleepStart ?? null}
              onChange={(sleepStart) =>
                dispatch({
                  type: 'SET_SLEEP_HOURS',
                  sleepStart,
                  sleepEnd: state.settings.sleepEnd ?? null,
                })}
            />
          </span>
        </label>
        <label className="settings-item settings-item-input">
          <span className="settings-item-label">通常の起床時刻</span>
          <span className="settings-input-wrap">
            <TimeSelectField
              id="sleepEnd"
              value={state.settings.sleepEnd ?? null}
              onChange={(sleepEnd) =>
                dispatch({
                  type: 'SET_SLEEP_HOURS',
                  sleepStart: state.settings.sleepStart ?? null,
                  sleepEnd,
                })}
            />
          </span>
        </label>
      </section>

      <section className="settings-card">
        <h3 className="settings-section-title">データ管理</h3>
        <div className="settings-data-actions">
          <button
            id="exportDataBtn"
            type="button"
            className="settings-secondary-btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ logs: state.logs, settings: state.settings, memos: state.memos }, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `smoking-tracker-backup-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            データをエクスポート
          </button>
          <button id="importDataBtn" type="button" className="settings-secondary-btn" onClick={() => fileRef.current?.click()}>
            データをインポート
          </button>
          <input
            ref={fileRef}
            id="importDataFile"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
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
                  dispatch({ type: 'SET_LOGS', logs: parsed.logs });
                }
                if (parsed.settings?.dailyTarget != null) {
                  dispatch({ type: 'SET_DAILY_TARGET', dailyTarget: Number(parsed.settings.dailyTarget || 0) });
                }
                if (parsed.settings) {
                  dispatch({
                    type: 'SET_SLEEP_HOURS',
                    sleepStart: parsed.settings.sleepStart ?? null,
                    sleepEnd: parsed.settings.sleepEnd ?? null,
                  });
                }
                if (typeof parsed.isPremium === 'boolean') {
                  dispatch({ type: 'SET_PREMIUM', isPremium: parsed.isPremium });
                }
                if (parsed.memos) {
                  Object.keys(state.memos).forEach((k) => dispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
                  Object.entries(parsed.memos).forEach(([k, v]) => dispatch({ type: 'SET_MEMO', dateKey: k, memo: v }));
                }
                setMessage('インポートが完了しました。');
              } catch {
                setMessage('ファイル形式が正しくありません。');
              }
              inputEl.value = '';
            }}
          />
        </div>
        <button
          className="settings-danger-btn"
          onClick={() => {
            if (!window.confirm('すべての記録をリセットします。よろしいですか？')) return;
            dispatch({ type: 'SET_LOGS', logs: {} });
            Object.keys(state.memos).forEach((k) => dispatch({ type: 'SET_MEMO', dateKey: k, memo: '' }));
            setMessage('全データをリセットしました。');
          }}
        >
          全データをリセット
        </button>
        {message ? <p className="settings-note">{message}</p> : null}
      </section>

      {isDevMode ? (
        <section id="settingsDebugSection" className="settings-card settings-debug-card">
          <h3 className="settings-section-title">開発者設定</h3>
          <label className="settings-item settings-item-debug">
            <span className="settings-item-label">プレミアムモード（デバッグ）</span>
            <span className="settings-debug-toggle-wrap">
              <input
                id="debugPremiumToggle"
                type="checkbox"
                checked={state.isPremium}
                onChange={(e) => dispatch({ type: 'SET_PREMIUM', isPremium: e.target.checked })}
              />
              <span className="settings-debug-toggle-ui" />
            </span>
          </label>
        </section>
      ) : null}
    </div>
  );
}

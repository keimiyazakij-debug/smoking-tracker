import { useEffect, useMemo, useState } from 'react';
import { IntervalGrowthChart } from '../components/interval/IntervalGrowthChart';
import { buildIntervalStoryState, type IntervalRange } from '../domain/interval';
import { moveBaseDate } from '../domain/date';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { isPremium as isPremiumSelector } from '../state/settings/settingsSelectors';

const RANGE_OPTIONS: Array<{ id: IntervalRange; label: string }> = [
  { id: 'recent7', label: '直近7日' },
  { id: 'week', label: '週次' },
  { id: 'month', label: '月次' },
  { id: 'all', label: '全期間' },
];

export function IntervalPage() {
  const { state: logsState } = useLogsContext();
  const { state: settingsState } = useSettingsContext();
  const isPremium = isPremiumSelector(settingsState);
  const [range, setRange] = useState<IntervalRange>('recent7');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [baseDateISO, setBaseDateISO] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const state = useMemo(
    () => buildIntervalStoryState(range, logsState.logs, settingsState.settings, isPremium, new Date(nowMs), new Date(baseDateISO)),
    [range, logsState.logs, settingsState.settings, isPremium, nowMs, baseDateISO],
  );
  const moveMode = range === 'week' ? 'week' : 'month';
  const canShowNext = useMemo(() => {
    if (range !== 'week' && range !== 'month') return false;
    const baseDate = new Date(baseDateISO);
    const now = new Date(nowMs);
    if (range === 'week') {
      const baseWeekStart = new Date(baseDate);
      baseWeekStart.setDate(baseWeekStart.getDate() - baseWeekStart.getDay());
      baseWeekStart.setHours(0, 0, 0, 0);
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);
      return baseWeekStart < currentWeekStart;
    }
    return (
      baseDate.getFullYear() < now.getFullYear()
      || (baseDate.getFullYear() === now.getFullYear() && baseDate.getMonth() < now.getMonth())
    );
  }, [baseDateISO, nowMs, range]);

  return (
    <div id="interval" className="tab active">
      <div className="card interval-summary-card">
        <div className="interval-summary-grid">
          <div className="interval-summary-main">
            <div className="interval-summary-title">{state.summaryTitle}</div>
            <div className="interval-summary-value">{state.summaryValue}</div>
            <div className="interval-summary-sub">{state.summaryDiffText}</div>
          </div>
          <div className="interval-summary-side">
            <div className="interval-summary-metric">
              <span className="interval-summary-metric-label">最少間隔</span>
              <span className="interval-summary-metric-value">{state.recent7MinText}</span>
            </div>
            <div className="interval-summary-metric">
              <span className="interval-summary-metric-label">平均間隔</span>
              <span className="interval-summary-metric-value">{state.recent7AvgText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card interval-controls-card">
        <div className="interval-range-buttons">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              id={`interval-range-${option.id}`}
              className={range === option.id ? 'is-active' : ''}
              onClick={() => {
                setRange(option.id);
                if (option.id === 'recent7' || option.id === 'all') setBaseDateISO(new Date(nowMs).toISOString());
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {state.showPremiumNotice ? (
        <div className="interval-free-notice">60日以前はPremiumで閲覧できます</div>
      ) : null}

      <div className="card interval-chart-card">
        {state.canNavigate ? (
          <div className="interval-period-nav">
            <button
              id="interval-prev"
              type="button"
              onClick={() => setBaseDateISO(moveBaseDate(new Date(baseDateISO), moveMode, -1).toISOString())}
            >
              ◀
            </button>
            <span id="interval-period-label">{state.periodLabel}</span>
            {canShowNext ? (
              <button
                id="interval-next"
                type="button"
                onClick={() => setBaseDateISO(moveBaseDate(new Date(baseDateISO), moveMode, 1).toISOString())}
              >
                ▶
              </button>
            ) : (
              <span className="interval-next-placeholder" aria-hidden />
            )}
          </div>
        ) : null}
        <h2 className="interval-chart-title">喫煙間隔の推移</h2>
        <IntervalGrowthChart points={state.points} />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { buildStatsState, normalizeGraphType } from '../domain/stats';
import { useAppContext } from '../state/AppContext';
import { moveBaseDate } from '../domain/date';
import type { GraphType, RangeType } from '../types/app';
import { StatsHeader } from '../components/stats/StatsHeader';
import { StatsRangeSelector } from '../components/stats/StatsRangeSelector';
import { StatsBaseDateNavigator } from '../components/stats/StatsBaseDateNavigator';
import { StatsSummary } from '../components/stats/StatsSummary';
import { StatsChart } from '../components/stats/StatsChart';

export function StatsPage() {
  const { state } = useAppContext();
  const [statsRangeType, setStatsRangeType] = useState<RangeType>('week');
  const [statsGraphType, setStatsGraphType] = useState<GraphType>('primary');
  const [statsBaseDateISO, setStatsBaseDateISO] = useState(() => new Date().toISOString());

  const graphType = normalizeGraphType(statsGraphType, statsRangeType);
  useEffect(() => {
    setStatsGraphType((prev) => normalizeGraphType(prev, statsRangeType));
  }, [statsRangeType]);
  const stats = useMemo(
    () => buildStatsState(statsRangeType, graphType, new Date(statsBaseDateISO), state.logs, state.isPremium),
    [statsRangeType, graphType, statsBaseDateISO, state.logs, state.isPremium],
  );

  return (
    <div id="stats" className="tab active">
      <StatsSummary
        total={stats.summary.total}
        average={stats.summary.diff ?? 0}
        best={stats.summary.max}
        currentAvgText={
          stats.summary.showPrev
            ? `前期間比較: ${stats.summary.diff && stats.summary.diff >= 0 ? '+' : ''}${stats.summary.diff ?? 0}本${stats.summary.percent ? ` (${stats.summary.percent}%)` : ''}`
            : '全期間'
        }
        maxText={stats.summary.maxDate ? `最大: ${stats.summary.max}本（${stats.summary.maxDate}）` : ''}
        minText={stats.summary.minDate ? `最小: ${stats.summary.min}本（${stats.summary.minDate}）` : ''}
      />

      <div id="statsFreeNotice" className="stats-free-notice">
        {!state.isPremium ? '無料版では直近60日分のデータを表示しています' : ''}
      </div>

      <StatsRangeSelector
        rangeType={statsRangeType}
        graphType={graphType}
        onChangeRange={(range) => setStatsRangeType(range as RangeType)}
        onChangeGraph={(graph) => setStatsGraphType(graph as GraphType)}
      />

      <div className="card stats-chart-card">
        <div id="stats-total-highlight" className="stats-total-highlight">{stats.label}：<strong>{stats.summary.total}本</strong></div>
        <StatsBaseDateNavigator
          label={stats.label}
          disabled={!stats.showNavigation}
          onPrev={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, -1).toISOString())}
          onNext={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, 1).toISOString())}
          titleNode={<StatsHeader title={stats.title} />}
        />
        <StatsChart data={stats} />
      </div>
    </div>
  );
}

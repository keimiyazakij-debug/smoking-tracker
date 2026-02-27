import { useEffect, useMemo, useState } from 'react';
import { buildStatsState, normalizeGraphType } from '../domain/stats';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { isPremium as isPremiumSelector } from '../state/settings/settingsSelectors';
import { moveBaseDate } from '../domain/date';
import type { GraphType, RangeType } from '../types/app';
import { StatsPageView } from './stats/StatsPageView';

export function StatsPage() {
  const { state: logsState } = useLogsContext();
  const { state: settingsState } = useSettingsContext();
  const isPremium = isPremiumSelector(settingsState);
  const [statsRangeType, setStatsRangeType] = useState<RangeType>('week');
  const [statsGraphType, setStatsGraphType] = useState<GraphType>('primary');
  const [statsBaseDateISO, setStatsBaseDateISO] = useState(() => new Date().toISOString());

  const graphType = normalizeGraphType(statsGraphType, statsRangeType);
  useEffect(() => {
    setStatsGraphType((prev) => normalizeGraphType(prev, statsRangeType));
  }, [statsRangeType]);
  const stats = useMemo(
    () => buildStatsState(statsRangeType, graphType, new Date(statsBaseDateISO), logsState.logs, isPremium),
    [statsRangeType, graphType, statsBaseDateISO, logsState.logs, isPremium],
  );

  const currentAvgText = stats.summary.showPrev
    ? `前期間比較: ${stats.summary.diff && stats.summary.diff >= 0 ? '+' : ''}${stats.summary.diff ?? 0}本`
    : '全期間';
  const maxText = stats.summary.maxDate ? `最大: ${stats.summary.max}本（${stats.summary.maxDate}）` : '';
  const minText = stats.summary.minDate ? `最小: ${stats.summary.min}本（${stats.summary.minDate}）` : '';

  return (
    <StatsPageView
      stats={stats}
      rangeType={statsRangeType}
      graphType={graphType}
      isPremium={isPremium}
      currentAvgText={currentAvgText}
      maxText={maxText}
      minText={minText}
      onChangeRange={(range) => setStatsRangeType(range)}
      onChangeGraph={(graph) => setStatsGraphType(graph)}
      onPrev={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, -1).toISOString())}
      onNext={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, 1).toISOString())}
    />
  );
}

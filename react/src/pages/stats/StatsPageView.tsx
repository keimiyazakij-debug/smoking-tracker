import type { StatsViewState } from '../../domain/stats';
import type { GraphType, RangeType } from '../../types/app';
import { StatsBaseDateNavigator } from '../../components/stats/StatsBaseDateNavigator';
import { StatsChart } from '../../components/stats/StatsChart';
import { StatsHeader } from '../../components/stats/StatsHeader';
import { StatsRangeSelector } from '../../components/stats/StatsRangeSelector';
import { StatsSummary } from '../../components/stats/StatsSummary';

type Props = {
  stats: StatsViewState;
  rangeType: RangeType;
  graphType: GraphType;
  isPremium: boolean;
  currentAvgText: string;
  maxText: string;
  minText: string;
  onChangeRange: (range: RangeType) => void;
  onChangeGraph: (graph: GraphType) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function StatsPageView({
  stats,
  rangeType,
  graphType,
  isPremium,
  currentAvgText,
  maxText,
  minText,
  onChangeRange,
  onChangeGraph,
  onPrev,
  onNext,
}: Props) {
  return (
    <div id="stats" className="tab active">
      <StatsSummary
        total={stats.summary.total}
        average={stats.summary.diff ?? 0}
        best={stats.summary.max}
        currentAvgText={currentAvgText}
        maxText={maxText}
        minText={minText}
      />

      <div id="statsFreeNotice" className="stats-free-notice">
        {!isPremium ? '無料版では直近60日分のデータを表示しています' : ''}
      </div>

      <StatsRangeSelector
        rangeType={rangeType}
        graphType={graphType}
        onChangeRange={(range) => onChangeRange(range as RangeType)}
        onChangeGraph={(graph) => onChangeGraph(graph as GraphType)}
      />

      <div className="card stats-chart-card">
        <StatsBaseDateNavigator label={stats.label} disabled={!stats.showNavigation} onPrev={onPrev} onNext={onNext} titleNode={<StatsHeader title={stats.title} />} />
        <StatsChart data={stats} />
      </div>
    </div>
  );
}

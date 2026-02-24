import type { GraphType, RangeType } from '../../types/app';

type Props = {
  rangeType: string;
  graphType: string;
  onChangeRange: (range: string) => void;
  onChangeGraph: (graph: string) => void;
};

export function StatsRangeSelector({ rangeType, graphType, onChangeRange, onChangeGraph }: Props) {
  return (
    <div className="card stats-controls-card">
      <div className="stats-section stats-row">
        <span className="stats-label">集計期間:</span>
        <div className="stats-range-buttons">
          {(['week', 'month', 'all'] as RangeType[]).map((r) => (
            <button key={r} id={`range-${r}`} className={rangeType === r ? 'is-active' : ''} onClick={() => onChangeRange(r)}>
              {r === 'week' ? '週' : r === 'month' ? '月' : '全期間'}
            </button>
          ))}
        </div>
      </div>
      <div className="stats-section stats-row">
        <span className="stats-label">集計種別:</span>
        <div className="stats-graph-buttons">
          {([
            { id: 'primary', label: rangeType === 'all' ? '月別' : '日別' },
            { id: 'hourly', label: '時間帯別' },
            { id: 'weekday', label: '曜日別' },
          ] as Array<{ id: GraphType; label: string }>).map((g) => (
            <button
              key={g.id}
              id={`graph-${g.id === 'primary' ? 'daily' : g.id}`}
              className={graphType === g.id ? 'is-active' : ''}
              disabled={g.id === 'weekday' && rangeType === 'week'}
              onClick={() => onChangeGraph(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

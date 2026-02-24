type Props = {
  total: number;
  average: number;
  best: number;
  currentAvgText?: string;
  maxText?: string;
  minText?: string;
};

export function StatsSummary({ total, average, best, currentAvgText, maxText, minText }: Props) {
  return (
    <div className="card stats-summary-card">
      <div className="stats-summary-row">
        <div id="stats-current-total" className="stats-summary-item">合計: {total}本</div>
        <div id="stats-current-avg" className="stats-summary-item">{currentAvgText ?? `平均: ${average}本`}</div>
      </div>
      <div className="stats-summary-row">
        <div id="stats-prev-total" className="stats-summary-item">{maxText ?? `最大: ${best}本`}</div>
        <div id="stats-prev-avg" className="stats-summary-item">{minText ?? ''}</div>
      </div>
    </div>
  );
}

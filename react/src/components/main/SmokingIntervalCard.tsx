import { formatHoursMinutes } from '../../hooks/useSmokingIntervals';

type Props = {
  currentMinutes: number;
  bestMinutes: number;
  todayLongestMinutes: number;
  message: string;
};

export function SmokingIntervalCard({ currentMinutes, bestMinutes, todayLongestMinutes, message }: Props) {
  return (
    <section className="card interval-card">
      <h2 className="interval-title">喫煙間隔</h2>
      <div className="interval-row interval-row-main">
        <div className="interval-item">
          <span className="interval-label">現在</span>
          <span id="currentIntervalDisplay" className="interval-value interval-value-current">{formatHoursMinutes(currentMinutes)}</span>
        </div>
        <div className="interval-item interval-item-right">
          <span className="interval-label">自己ベスト</span>
          <span id="bestIntervalDisplay" className="interval-value interval-value-best">{formatHoursMinutes(bestMinutes)}</span>
        </div>
      </div>
      <div className="interval-row interval-row-sub">
        <span className="interval-label">今日の最長</span>
        <span id="todayLongestDisplay" className="interval-value interval-value-today">{formatHoursMinutes(todayLongestMinutes)}</span>
      </div>
      <div id="mainMessageBlock" className="interval-message-block" aria-live="polite">
        {message}
      </div>
    </section>
  );
}

type Props = {
  todayKey: string;
  todayCount: number;
  target: number;
  diffText: { text: string; className: string };
  progress: number;
};

export function TodayStatusCard({ todayKey, todayCount, target, diffText, progress }: Props) {
  return (
    <section className="today-status card">
      <div className="today-status-header">
        <div className="today-label">今日の状態</div>
        <div id="todayDisplay" className="today-date">{todayKey}</div>
      </div>
      <div className="today-count-row">
        <div className="today-count-wrap">
          <div className="today-count-main">
            <div id="todayCountDisplay" className="today-count">{todayCount}</div>
            <div id="todayCountUnit" className="today-count-unit">本</div>
          </div>
          <div id="todayTargetDisplay" className="today-target-display">目標 {target}本</div>
        </div>
        <div id="yesterdayDiff" className={`yesterday-diff ${diffText.className}`}>{diffText.text}</div>
      </div>
      <div id="progress-bar" className="progress-bar">
        <div id="progress" style={{ width: `${progress}%` }} className={todayCount > target ? 'progress-yellow' : 'progress-green'} />
      </div>
    </section>
  );
}

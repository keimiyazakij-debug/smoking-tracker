type Props = {
  dateKey: string;
  total: number;
  hasLogsEntry: boolean;
  isPrevLocked: boolean;
  isNextHidden: boolean;
  source: 'calendar' | 'home' | null;
  sourceDateKey?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onDeleteAll: () => void;
};

export function TimelineHeader({
  dateKey,
  total,
  hasLogsEntry,
  isPrevLocked,
  isNextHidden,
  source,
  sourceDateKey: _sourceDateKey,
  onPrev,
  onNext,
  onBack,
  onDeleteAll,
}: Props) {
  void _sourceDateKey;
  return (
    <header className="timeline-header">
      {source ? (
        <button id="timelineBackLink" className="timeline-back-link" onClick={onBack}>
          {source === 'calendar' ? '← カレンダーに戻る' : '← メインに戻る'}
        </button>
      ) : null}
      <div className="timeline-header-date">
        <button id="prevTimelineDay" className="timeline-nav" style={{ visibility: isPrevLocked ? 'hidden' : 'visible' }} onClick={onPrev}>
          ◀
        </button>
        <div id="timelineTitle" className="timeline-title-main">{dateKey.replaceAll('-', '/')}</div>
        <button id="nextTimelineDay" className="timeline-nav" style={{ visibility: isNextHidden ? 'hidden' : 'visible' }} onClick={onNext}>
          ▶
        </button>
      </div>
      <div id="timelineSummary" className="timeline-title-sub">合計 {total}本</div>
      <button
        id="timelineDeleteAllBtn"
        className="timeline-delete-all-btn"
        type="button"
        style={{ display: hasLogsEntry ? 'inline-block' : 'none' }}
        onClick={onDeleteAll}
      >
        この日の記録を全削除
      </button>
    </header>
  );
}

type Props = {
  onOpenTimeline: () => void;
};

export function HistoryCTA({ onOpenTimeline }: Props) {
  return (
    <section className="history-cta">
      <button id="todayTimelineLink" className="sub-large-btn" onClick={onOpenTimeline}>
        今日の履歴
      </button>
    </section>
  );
}

type Props = {
  hour: number;
  count: number;
  onClick: () => void;
};

function getHeatClass(count: number): string {
  if (count >= 4) return 'count-4';
  if (count === 3) return 'count-3';
  if (count === 2) return 'count-2';
  if (count === 1) return 'count-1';
  return '';
}

export function TimelineHourCell({ hour, count, onClick }: Props) {
  return (
    <div className={`timeline-cell ${getHeatClass(count)}`}>
      <button type="button" onClick={onClick}>
        <div className="timeline-hour">{hour}時</div>
        <div className={`timeline-count ${count === 0 ? 'empty' : ''}`}>{count === 0 ? '' : `${count}本`}</div>
      </button>
    </div>
  );
}

import type { CalendarCell as CalendarCellType } from '../../domain/calendar';

type Props = {
  cell: CalendarCellType;
  isSelected: boolean;
  holidayName?: string;
  hasMemo: boolean;
  locked: boolean;
  dailyTarget: number;
  isSunday?: boolean;
  isSaturday?: boolean;
  onClick: () => void;
};

export function CalendarCell({
  cell,
  isSelected,
  holidayName,
  hasMemo,
  locked,
  dailyTarget,
  isSunday = false,
  isSaturday = false,
  onClick,
}: Props) {
  const countBgClass = [
    'count-bg',
    cell.count == null ? 'empty' : '',
    cell.status === 'unrecorded'
      ? 'count-unrecorded'
      : (cell.count ?? 0) <= dailyTarget
        ? 'count-achieved'
        : 'count-exceeded',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      title={holidayName ? `祝日: ${holidayName}` : undefined}
      className={`calendar-day ${cell.inMonth ? '' : 'gray'} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${holidayName ? 'holiday' : ''} ${locked ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${cell.isToday ? 'today' : ''} ${cell.isPast ? 'past' : ''} ${cell.status}`}
      onClick={onClick}
    >
      <div className="day-number">{cell.day}</div>
      <div className={countBgClass}>
        <span className="count-number">{cell.count == null ? '' : String(cell.count)}</span>
      </div>
      {locked ? <span className="lock-mark">🔒</span> : hasMemo ? <span className="memo-indicator" /> : null}
    </button>
  );
}

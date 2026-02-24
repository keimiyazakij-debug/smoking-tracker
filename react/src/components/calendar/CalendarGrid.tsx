import { parseDateKey, isDateLocked } from '../../domain/date';
import type { CalendarCell as CalendarCellType } from '../../domain/calendar';
import { CalendarCell } from './CalendarCell';

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

type Props = {
  cells: CalendarCellType[];
  selectedDateKey: string;
  todayKey: string;
  holidayMap: Record<string, string>;
  memos: Record<string, string>;
  logs: Record<string, string[]>;
  dailyTarget: number;
  isPremium: boolean;
  onSelect: (dateKey: string) => void;
};

export function CalendarGrid({
  cells,
  selectedDateKey,
  todayKey: _todayKey,
  holidayMap,
  memos,
  logs: _logs,
  dailyTarget,
  isPremium,
  onSelect,
}: Props) {
  return (
    <div id="calendarGrid" className="calendar-grid">
      {DOW.map((d) => (
        <div key={d} className={`calendar-head ${d === '日' ? 'sunday' : ''} ${d === '土' ? 'saturday' : ''}`}>{d}</div>
      ))}
      {cells.map((cell) => {
        const dow = parseDateKey(cell.dateKey).getDay();
        const holidayName = holidayMap[cell.dateKey] || '';
        const hasMemo = !!memos[cell.dateKey]?.trim();
        const locked = isDateLocked(cell.dateKey, isPremium);

        return (
          <CalendarCell
            key={cell.dateKey}
            cell={cell}
            isSelected={cell.dateKey === selectedDateKey}
            holidayName={holidayName}
            hasMemo={hasMemo}
            locked={locked}
            dailyTarget={dailyTarget}
            isSunday={dow === 0}
            isSaturday={dow === 6}
            onClick={() => {
              if (locked) return;
              onSelect(cell.dateKey);
            }}
          />
        );
      })}
    </div>
  );
}

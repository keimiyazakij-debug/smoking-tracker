import type { CalendarCell } from '../../domain/calendar';
import type { DailyMemos, Logs } from '../../types/app';
import { CalendarDetailPanel } from '../../components/calendar/CalendarDetailPanel';
import { CalendarGrid } from '../../components/calendar/CalendarGrid';
import { CalendarHeader } from '../../components/calendar/CalendarHeader';

type Props = {
  year: number;
  month: number;
  cells: CalendarCell[];
  selectedDateKey: string;
  todayKey: string;
  holidayMap: Record<string, string>;
  memos: DailyMemos;
  logs: Logs;
  dailyTarget: number;
  isPremium: boolean;
  detailCell: CalendarCell | null;
  detailDateKey: string | null;
  isDetailLocked: boolean;
  showConfirmBtn: boolean;
  memoText: string;
  statusLine: { text: string; tone: '' | 'orange' | 'blue' };
  isEditingMemo: boolean;
  memoDraft: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  onEditMemo: () => void;
  onChangeMemo: (memo: string) => void;
  onSaveMemo: () => void;
  onCancelEdit: () => void;
  onMarkSuccess: () => void;
  onOpenTimeline: () => void;
};

export function CalendarPageView({
  year,
  month,
  cells,
  selectedDateKey,
  todayKey,
  holidayMap,
  memos,
  logs,
  dailyTarget,
  isPremium,
  detailCell,
  detailDateKey,
  isDetailLocked,
  showConfirmBtn,
  memoText,
  statusLine,
  isEditingMemo,
  memoDraft,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onEditMemo,
  onChangeMemo,
  onSaveMemo,
  onCancelEdit,
  onMarkSuccess,
  onOpenTimeline,
}: Props) {
  return (
    <div id="calendar" className="tab active">
      <CalendarHeader year={year} month={month} onPrev={onPrevMonth} onNext={onNextMonth} />

      <div className="card calendar-card">
        <CalendarGrid
          cells={cells}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
          holidayMap={holidayMap}
          memos={memos}
          logs={logs}
          dailyTarget={dailyTarget}
          isPremium={isPremium}
          onSelect={onSelectDate}
        />
      </div>

      <CalendarDetailPanel
        detailCell={detailCell}
        detailDateKey={detailDateKey}
        isLocked={isDetailLocked}
        showConfirmBtn={showConfirmBtn}
        memoText={memoText}
        statusLine={statusLine}
        isEditing={isEditingMemo}
        memoDraft={memoDraft}
        onEdit={onEditMemo}
        onChangeMemo={onChangeMemo}
        onSaveMemo={onSaveMemo}
        onCancelEdit={onCancelEdit}
        onMarkSuccess={onMarkSuccess}
        onOpenTimeline={onOpenTimeline}
      />
    </div>
  );
}

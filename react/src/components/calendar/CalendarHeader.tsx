type Props = {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
};

export function CalendarHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <div className="calendar-header">
      <button onClick={onPrev}>◀</button>
      <span id="calendarTitle">{year}年 {month + 1}月</span>
      <button onClick={onNext}>▶</button>
    </div>
  );
}

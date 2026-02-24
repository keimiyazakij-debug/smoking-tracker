import { TimelineHourCell } from './TimelineHourCell';

type Props = {
  map: Record<number, string[]>;
  onEditHour: (hour: number) => void;
};

export function TimelineGrid({ map, onEditHour }: Props) {
  return (
    <div id="timelineList" className="timeline-grid">
      {Array.from({ length: 24 }, (_, h) => {
        const count = map[h]?.length ?? 0;
        return <TimelineHourCell key={h} hour={h} count={count} onClick={() => onEditHour(h)} />;
      })}
    </div>
  );
}

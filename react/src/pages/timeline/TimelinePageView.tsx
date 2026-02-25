import { TimelineEditModal, type EditState } from '../../components/timeline/TimelineEditModal';
import { TimelineGrid } from '../../components/timeline/TimelineGrid';
import { TimelineHeader } from '../../components/timeline/TimelineHeader';

type TimelineSource = 'calendar' | 'home' | null;

type Props = {
  dateKey: string;
  total: number;
  hasLogsEntry: boolean;
  isPrevLocked: boolean;
  isNextHidden: boolean;
  source: TimelineSource;
  sourceDateKey: string | null;
  map: Record<number, string[]>;
  edit: EditState | null;
  todayKey: string;
  error: string;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onDeleteAll: () => void;
  onEditHour: (hour: number) => void;
  onChangeDate: (dateKey: string) => void;
  onChangeTime: (index: number, value: string) => void;
  onAddTime: () => void;
  onRemoveTime: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
};

export function TimelinePageView({
  dateKey,
  total,
  hasLogsEntry,
  isPrevLocked,
  isNextHidden,
  source,
  sourceDateKey,
  map,
  edit,
  todayKey,
  error,
  onPrev,
  onNext,
  onBack,
  onDeleteAll,
  onEditHour,
  onChangeDate,
  onChangeTime,
  onAddTime,
  onRemoveTime,
  onSave,
  onClose,
}: Props) {
  return (
    <div id="timeline" className="tab active">
      <TimelineHeader
        dateKey={dateKey}
        total={total}
        hasLogsEntry={hasLogsEntry}
        isPrevLocked={isPrevLocked}
        isNextHidden={isNextHidden}
        source={source}
        sourceDateKey={sourceDateKey}
        onPrev={onPrev}
        onNext={onNext}
        onBack={onBack}
        onDeleteAll={onDeleteAll}
      />

      <div className="card timeline-card">
        <h2 className="timeline-page-title">時間帯別本数</h2>
        <div className="timeline-legend" aria-hidden="true">
          <span className="legend-label">少</span>
          <span className="legend-chip legend-0" />
          <span className="legend-chip legend-1" />
          <span className="legend-chip legend-2" />
          <span className="legend-chip legend-3" />
          <span className="legend-label">多</span>
        </div>
        <TimelineGrid map={map} onEditHour={onEditHour} />
      </div>

      <TimelineEditModal
        edit={edit}
        todayKey={todayKey}
        error={error}
        onChangeDate={onChangeDate}
        onChangeTime={onChangeTime}
        onAddTime={onAddTime}
        onRemoveTime={onRemoveTime}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
}

import { TimeSelectRow } from '../TimeSelectRow';

export type EditState = {
  sourceDateKey: string;
  dateKey: string;
  hour: number;
  times: string[];
  untouchedTimes: string[];
};

type Props = {
  edit: EditState | null;
  todayKey: string;
  error: string;
  onChangeDate: (date: string) => void;
  onChangeTime: (index: number, value: string) => void;
  onAddTime: () => void;
  onRemoveTime: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
};

export function TimelineEditModal({
  edit,
  todayKey,
  error,
  onChangeDate,
  onChangeTime,
  onAddTime,
  onRemoveTime,
  onSave,
  onClose,
}: Props) {
  return (
    <div id="editOverlay" className={`modal-overlay ${edit ? '' : 'hidden'}`}>
      <div className="modal-card edit-body">
        <h2 id="editTitle" className="edit-page-title">{edit ? `記録を編集（${edit.hour}時台）` : '記録を編集'}</h2>
        <label className="edit-field">
          <span className="edit-field-label">日付</span>
          <input
            id="editDateInput"
            type="date"
            max={todayKey}
            value={edit?.dateKey ?? ''}
            onChange={(e) => onChangeDate(e.target.value)}
          />
        </label>
        <div id="timeTags" className="time-tags">
          {(edit?.times || []).map((time, i) => (
            <TimeSelectRow
              key={`${i}-${time}`}
              value={time}
              onChange={(next) => onChangeTime(i, next)}
              onRemove={() => onRemoveTime(i)}
            />
          ))}
          {(edit?.times || []).length === 0 ? <div className="time-empty">記録がありません</div> : null}
        </div>
        <button id="addTimeTagBtn" type="button" onClick={onAddTime}>時刻を追加</button>
        <div id="editDateLockNotice" className="edit-field-help">{error}</div>
        <button id="saveEditBtn" type="button" className="edit-save-btn" onClick={onSave}>保存</button>
        <button id="closeEditBtn" type="button" onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

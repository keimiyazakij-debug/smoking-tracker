import { useEffect, useState } from 'react';
import type { CalendarCell as CalendarCellType } from '../../domain/calendar';

type Props = {
  detailCell: CalendarCellType | null;
  detailDateKey: string | null;
  isLocked: boolean;
  showConfirmBtn: boolean;
  memoText: string;
  statusLine: { text: string; tone: '' | 'orange' | 'blue' };
  isEditing: boolean;
  memoDraft: string;
  onEdit: () => void;
  onChangeMemo: (v: string) => void;
  onSaveMemo: () => void;
  onCancelEdit: () => void;
  onMarkSuccess: () => void;
  onOpenTimeline: () => void;
};

export function CalendarDetailPanel({
  detailCell,
  detailDateKey,
  isLocked,
  showConfirmBtn,
  memoText,
  statusLine,
  isEditing,
  memoDraft,
  onEdit,
  onChangeMemo,
  onSaveMemo,
  onCancelEdit,
  onMarkSuccess,
  onOpenTimeline,
}: Props) {
  const [isMemoExpanded, setIsMemoExpanded] = useState(false);
  const hasMemoOverflow = memoText.split('\n').length > 2 || memoText.length > 80;

  useEffect(() => {
    setIsMemoExpanded(false);
  }, [detailDateKey, memoText, isEditing]);

  return (
    <section id="calendarDetail" className="calendar-detail" hidden={!detailCell}>
      {detailCell && detailDateKey && (
        <>
          {!isLocked || showConfirmBtn ? (
            <div className="calendar-detail-link-wrap">
              {!isLocked ? (
                <button className="calendar-detail-link-btn" onClick={onOpenTimeline}>
                  この日の記録を見る
                </button>
              ) : null}
              {showConfirmBtn ? (
                <button className="calendar-detail-success-btn" onClick={onMarkSuccess}>
                  禁煙成功で確定
                </button>
              ) : null}
            </div>
          ) : null}
          <article className="memo-card">
            {isLocked ? (
              <p className="memo-empty">60日より前のデータはプレミアム版で閲覧できます。</p>
            ) : null}
            {!isEditing ? (
              <p className={`memo-status-line ${statusLine.tone === 'orange' ? 'memo-status-line--orange' : statusLine.tone === 'blue' ? 'memo-status-line--blue' : ''}`}>
                {statusLine.text}
              </p>
            ) : null}
            {!isLocked ? (
              isEditing ? (
                <>
                  <textarea
                    className="memo-editor"
                    value={memoDraft}
                    onChange={(e) => onChangeMemo(e.target.value)}
                    placeholder="この日のメモを入力"
                    rows={3}
                  />
                  <div className="memo-actions">
                    <button type="button" className="memo-edit-btn" onClick={onSaveMemo}>完了</button>
                    <button type="button" className="memo-edit-btn" onClick={onCancelEdit}>取り消し</button>
                  </div>
                </>
              ) : memoText.trim().length > 0 ? (
                <>
                  <p className={`memo-text ${isMemoExpanded ? '' : 'memo-preview'}`}>{memoText}</p>
                  <div className="memo-actions">
                    {hasMemoOverflow ? (
                      <button type="button" className="memo-toggle-btn" onClick={() => setIsMemoExpanded((prev) => !prev)}>
                        {isMemoExpanded ? '折りたたむ' : 'もっと見る'}
                      </button>
                    ) : null}
                    <button type="button" className="memo-edit-btn" onClick={onEdit}>編集する</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="memo-empty">メモはまだありません</p>
                  <button type="button" className="memo-edit-btn" onClick={onEdit}>編集する</button>
                </>
              )
            ) : null}
          </article>
        </>
      )}
    </section>
  );
}

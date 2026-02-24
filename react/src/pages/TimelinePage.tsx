import { useEffect, useMemo, useState } from 'react';
import { getDateKey, isDateLocked, parseDateKey } from '../domain/date';
import { useAppContext } from '../state/AppContext';
import { TimeSelectRow } from '../components/TimeSelectRow';
import { useLocation, useNavigate } from 'react-router-dom';

function getHeatClass(count: number): string {
  if (count >= 4) return 'count-4';
  if (count === 3) return 'count-3';
  if (count === 2) return 'count-2';
  if (count === 1) return 'count-1';
  return '';
}

type EditState = {
  sourceDateKey: string;
  dateKey: string;
  hour: number;
  times: string[];
  untouchedTimes: string[];
};

function toHHMM(ts: string): string | null {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toIsoAt(dateKey: string, hhmm: string): string | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [hhRaw, mmRaw] = hhmm.split(':').map(Number);
  if (!Number.isInteger(hhRaw) || !Number.isInteger(mmRaw)) return null;
  if (hhRaw < 0 || hhRaw > 23 || mmRaw < 0 || mmRaw > 59) return null;
  const d = new Date(`${dateKey}T${String(hhRaw).padStart(2, '0')}:${String(mmRaw).padStart(2, '0')}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function TimelinePage() {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const queryDate = params.get('date');
  const initialDateKey = queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) ? queryDate : getDateKey(new Date());
  const [dateKey, setDateKey] = useState(initialDateKey);
  const timelineSource = params.get('from') === 'calendar' ? 'calendar' : params.get('from') === 'home' ? 'home' : null;
  const timelineSourceDateKey = params.get('sourceDate');
  const list = state.logs[dateKey] || [];
  const hasLogsEntry = Object.prototype.hasOwnProperty.call(state.logs, dateKey);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState('');

  const map = useMemo(() => {
    const out: Record<number, string[]> = {};
    list.forEach((t) => {
      const d = new Date(t);
      if (getDateKey(d) !== dateKey) return;
      const h = d.getHours();
      const mm = String(d.getMinutes()).padStart(2, '0');
      const hh = String(h).padStart(2, '0');
      if (!out[h]) out[h] = [];
      out[h].push(`${hh}:${mm}`);
    });
    Object.keys(out).forEach((h) => out[Number(h)].sort());
    return out;
  }, [list, dateKey]);

  const total = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
  const todayKey = getDateKey(new Date());
  useEffect(() => {
    if (initialDateKey !== dateKey) {
      setDateKey(initialDateKey);
    }
  }, [initialDateKey, dateKey]);
  const prevDate = parseDateKey(dateKey);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevKey = getDateKey(prevDate);
  const isPrevLocked = isDateLocked(prevKey, state.isPremium);

  const openEdit = (hour: number) => {
    const source = state.logs[dateKey] || [];
    const scoped: string[] = [];
    const untouched: string[] = [];
    source.forEach((ts) => {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return;
      if (d.getHours() === hour) {
        const hhmm = toHHMM(ts);
        if (hhmm) scoped.push(hhmm);
      } else {
        untouched.push(ts);
      }
    });
    setError('');
    setEdit({
      sourceDateKey: dateKey,
      dateKey,
      hour,
      times: scoped.sort(),
      untouchedTimes: untouched,
    });
  };

  const updateTime = (index: number, value: string) => {
    if (!edit) return;
    const next = [...edit.times];
    next[index] = value;
    setEdit({ ...edit, times: next });
  };

  const addTime = () => {
    if (!edit) return;
    const hh = String(edit.hour).padStart(2, '0');
    setEdit({ ...edit, times: [...edit.times, `${hh}:00`] });
  };

  const removeTime = (index: number) => {
    if (!edit) return;
    const next = edit.times.filter((_, i) => i !== index);
    setEdit({ ...edit, times: next });
  };

  const saveEdit = () => {
    if (!edit) return;
    const cleanTimes = edit.times.map((t) => t.trim()).filter((t) => t.length > 0);
    if (edit.dateKey > todayKey) {
      setError('未来の日付は保存できません');
      return;
    }
    if (edit.dateKey === todayKey && cleanTimes.length > 0) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const hasFuture = cleanTimes.some((t) => {
        const [hh, mm] = t.split(':').map(Number);
        if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
        return (hh * 60 + mm) > nowMin;
      });
      if (hasFuture) {
        setError('未来の時刻は保存できません');
        return;
      }
    }

    const scopedIso = cleanTimes.length === 0
      ? []
      : cleanTimes
          .map((t) => toIsoAt(edit.dateKey, t))
          .filter((t): t is string => !!t)
          .sort();
    if (cleanTimes.length > 0 && scopedIso.length === 0) {
      setError('時刻の形式が不正です');
      return;
    }

    const nextLogs = { ...state.logs };
    if (edit.dateKey === edit.sourceDateKey) {
      const merged = [...edit.untouchedTimes, ...scopedIso].sort();
      if (merged.length === 0) delete nextLogs[edit.dateKey];
      else nextLogs[edit.dateKey] = merged;
    } else {
      if (edit.untouchedTimes.length === 0) delete nextLogs[edit.sourceDateKey];
      else nextLogs[edit.sourceDateKey] = [...edit.untouchedTimes].sort();
      const targetExisting = nextLogs[edit.dateKey] || [];
      nextLogs[edit.dateKey] = [...targetExisting, ...scopedIso].sort();
    }

    dispatch({ type: 'SET_LOGS', logs: nextLogs });
    if (edit.dateKey !== dateKey) {
      setDateKey(edit.dateKey);
      const next = new URLSearchParams(location.search);
      next.set('date', edit.dateKey);
      navigate(`/timeline?${next.toString()}`, { replace: true });
    }
    setError('');
    setEdit(null);
  };

  const deleteAllForCurrentDate = () => {
    if (!hasLogsEntry) return;
    const nextLogs = { ...state.logs };
    delete nextLogs[dateKey];
    dispatch({ type: 'SET_LOGS', logs: nextLogs });
  };

  return (
    <div id="timeline" className="tab active">
      <header className="timeline-header">
        {timelineSource ? (
          <button
            id="timelineBackLink"
            className="timeline-back-link"
            onClick={() => navigate(timelineSource === 'calendar' ? `/calendar?date=${timelineSourceDateKey || dateKey}` : '/main')}
          >
            {timelineSource === 'calendar' ? '← カレンダーに戻る' : '← メインに戻る'}
          </button>
        ) : null}
        <div className="timeline-header-date">
          <button
            id="prevTimelineDay"
            className="timeline-nav"
            style={{ visibility: isPrevLocked ? 'hidden' : 'visible' }}
            onClick={() => {
              if (isPrevLocked) return;
              const d = parseDateKey(dateKey);
              d.setDate(d.getDate() - 1);
              const nextKey = getDateKey(d);
              setDateKey(nextKey);
              const next = new URLSearchParams(location.search);
              next.set('date', nextKey);
              navigate(`/timeline?${next.toString()}`, { replace: true });
            }}
          >
            ◀
          </button>
          <div id="timelineTitle" className="timeline-title-main">{dateKey.replaceAll('-', '/')}</div>
          <button
            id="nextTimelineDay"
            className="timeline-nav"
            style={{ visibility: dateKey >= todayKey ? 'hidden' : 'visible' }}
            onClick={() => {
              const d = parseDateKey(dateKey);
              d.setDate(d.getDate() + 1);
              const nextKey = getDateKey(d);
              if (nextKey > todayKey) return;
              setDateKey(nextKey);
              const next = new URLSearchParams(location.search);
              next.set('date', nextKey);
              navigate(`/timeline?${next.toString()}`, { replace: true });
            }}
          >
            ▶
          </button>
        </div>
        <div id="timelineSummary" className="timeline-title-sub">合計 {total}本</div>
        <button
          id="timelineDeleteAllBtn"
          className="timeline-delete-all-btn"
          type="button"
          style={{ display: hasLogsEntry ? 'inline-block' : 'none' }}
          onClick={deleteAllForCurrentDate}
        >
          この日の記録を全削除
        </button>
      </header>

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
        <div id="timelineList" className="timeline-grid">
          {Array.from({ length: 24 }, (_, h) => {
            const count = map[h]?.length ?? 0;
            return (
              <div key={h} className={`timeline-cell ${getHeatClass(count)}`}>
                <button type="button" onClick={() => openEdit(h)}>
                  <div className="timeline-hour">{h}時</div>
                  <div className={`timeline-count ${count === 0 ? 'empty' : ''}`}>{count === 0 ? '' : `${count}本`}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

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
              onChange={(e) => edit && setEdit({ ...edit, dateKey: e.target.value })}
            />
          </label>
          <div id="timeTags" className="time-tags">
            {(edit?.times || []).map((time, i) => (
              <TimeSelectRow
                key={`${i}-${time}`}
                value={time}
                onChange={(next) => updateTime(i, next)}
                onRemove={() => removeTime(i)}
              />
            ))}
            {(edit?.times || []).length === 0 ? <div className="time-empty">記録がありません</div> : null}
          </div>
          <button id="addTimeTagBtn" type="button" onClick={addTime}>時刻を追加</button>
          <div id="editDateLockNotice" className="edit-field-help">{error}</div>
          <button id="saveEditBtn" type="button" className="edit-save-btn" onClick={saveEdit}>保存</button>
          <button id="closeEditBtn" type="button" onClick={() => { setError(''); setEdit(null); }}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { buildCalendarCells } from '../domain/calendar';
import { getDateKey, isDateLocked, parseDateKey } from '../domain/date';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage } from '../platform/storage';
import { CalendarPageView } from './calendar/CalendarPageView';
const HOLIDAY_CACHE_PREFIX = 'holidays_';
const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/PublicHolidays';

type Holiday = {
  date: string;
  localName: string;
  name: string;
};

export function CalendarPage() {
  const { state: logsState, dispatch: logsDispatch } = useLogsContext();
  const { state: settingsState } = useSettingsContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [memoEditingDateKey, setMemoEditingDateKey] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const initialDate = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return parseDateKey(q);
    return new Date();
  }, [location.search]);
  const [calendarYear, setCalendarYear] = useState(() => initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => initialDate.getMonth());
  const [calendarSelectedDateKey, setCalendarSelectedDateKey] = useState(() => getDateKey(initialDate));
  const todayKey = getDateKey(new Date());
  const cells = useMemo(
    () => buildCalendarCells(calendarYear, calendarMonth, todayKey, logsState.logs),
    [calendarYear, calendarMonth, todayKey, logsState.logs],
  );

  const selected = cells.find((c) => c.dateKey === calendarSelectedDateKey);
  const fallbackSelected = cells.find((c) => c.inMonth && c.day === 1) ?? null;
  const detailCell = selected ?? fallbackSelected;
  const detailDateKey = detailCell?.dateKey ?? null;
  const isDetailLocked = detailDateKey ? isDateLocked(detailDateKey, settingsState.isPremium) : false;
  const hasLogsEntry = detailDateKey ? Object.prototype.hasOwnProperty.call(logsState.logs, detailDateKey) : false;
  const showConfirmBtn = !!detailDateKey && !isDetailLocked && !hasLogsEntry && detailDateKey < todayKey;
  const memoText = detailDateKey ? (logsState.memos[detailDateKey] || '') : '';
  const isEditingMemo = !!detailDateKey && memoEditingDateKey === detailDateKey;
  const holidayMap = useMemo(
    () =>
      holidays.reduce<Record<string, string>>((acc, h) => {
        acc[h.date] = h.localName || h.name || '';
        return acc;
      }, {}),
    [holidays],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('date');
    if (!q || !/^\d{4}-\d{2}-\d{2}$/.test(q)) return;
    const d = parseDateKey(q);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
    setCalendarSelectedDateKey(getDateKey(d));
  }, [location.search]);

  useEffect(() => {
    if ((!selected || !selected.inMonth) && fallbackSelected) {
      const today = parseDateKey(todayKey);
      if (today.getFullYear() === calendarYear && today.getMonth() === calendarMonth) {
        setCalendarSelectedDateKey(todayKey);
      } else {
        setCalendarSelectedDateKey(fallbackSelected.dateKey);
      }
    }
  }, [selected, fallbackSelected, todayKey, calendarYear, calendarMonth]);

  useEffect(() => {
    if (!detailDateKey) {
      setMemoEditingDateKey(null);
      setMemoDraft('');
      return;
    }
    if (memoEditingDateKey && memoEditingDateKey !== detailDateKey) {
      setMemoEditingDateKey(null);
      setMemoDraft('');
    }
  }, [detailDateKey, memoEditingDateKey]);

  useEffect(() => {
    let cancelled = false;
    const key = `${HOLIDAY_CACHE_PREFIX}${calendarYear}`;
    const fromCache = storage.getItem(key);
    if (fromCache) {
      try {
        const parsed = JSON.parse(fromCache) as Holiday[];
        if (!cancelled) setHolidays(Array.isArray(parsed) ? parsed : []);
      } catch {
        storage.removeItem(key);
      }
    } else {
      setHolidays([]);
    }

    (async () => {
      try {
        const response = await fetch(`${HOLIDAY_API_BASE}/${calendarYear}/JP`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as Holiday[];
        const normalized = Array.isArray(data)
          ? data
              .filter((x) => typeof x?.date === 'string')
              .map((x) => ({ date: x.date, localName: String(x.localName || ''), name: String(x.name || '') }))
          : [];
        storage.setItem(key, JSON.stringify(normalized));
        if (!cancelled) setHolidays(normalized);
      } catch {
        // noop: offline/blocked environment
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [calendarYear]);

  const statusLine = useMemo(() => {
    if (!detailDateKey) return { text: ' ', tone: '' as '' | 'orange' | 'blue' };
    const current = logsState.logs[detailDateKey];
    if (current === undefined) return { text: ' ', tone: '' as '' | 'orange' | 'blue' };
    if (current.length === 0) return { text: '🏆今日は禁煙達成です', tone: 'blue' as const };
    const prev = parseDateKey(detailDateKey);
    prev.setDate(prev.getDate() - 1);
    const prevKey = getDateKey(prev);
    const prevLogs = logsState.logs[prevKey];
    if (prevLogs === undefined) return { text: ' ', tone: '' as '' | 'orange' | 'blue' };
    const diff = prevLogs.length - current.length;
    if (diff < 0) return { text: `⚠前日より +${Math.abs(diff)}本`, tone: 'orange' as const };
    if (diff > 0) return { text: `☆前日より -${diff}本`, tone: 'blue' as const };
    return { text: ' ', tone: '' as '' | 'orange' | 'blue' };
  }, [detailDateKey, logsState.logs]);

  const beginMemoEdit = () => {
    if (!detailDateKey || isDetailLocked) return;
    setMemoEditingDateKey(detailDateKey);
    setMemoDraft(memoText);
  };

  const saveMemo = () => {
    if (!detailDateKey || isDetailLocked) return;
    logsDispatch({ type: 'SET_MEMO', dateKey: detailDateKey, memo: memoDraft });
    setMemoEditingDateKey(null);
    setMemoDraft('');
  };

  const goPrevMonth = () => {
    const d = new Date(calendarYear, calendarMonth, 1);
    d.setMonth(d.getMonth() - 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
    setCalendarSelectedDateKey(getDateKey(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  const goNextMonth = () => {
    const d = new Date(calendarYear, calendarMonth, 1);
    d.setMonth(d.getMonth() + 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
    setCalendarSelectedDateKey(getDateKey(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  const handleCancelEdit = () => {
    setMemoEditingDateKey(null);
    setMemoDraft('');
  };

  const handleMarkSuccess = () => {
    if (!detailDateKey) return;
    logsDispatch({ type: 'MARK_SUCCESS', dateKey: detailDateKey });
  };

  const handleOpenTimeline = () => {
    if (!detailDateKey) return;
    navigate(`/timeline?date=${detailDateKey}&from=calendar&sourceDate=${detailDateKey}`);
  };

  return (
    <CalendarPageView
      year={calendarYear}
      month={calendarMonth}
      cells={cells}
      selectedDateKey={calendarSelectedDateKey}
      todayKey={todayKey}
      holidayMap={holidayMap}
      memos={logsState.memos}
      logs={logsState.logs}
      dailyTarget={settingsState.settings.dailyTarget}
      isPremium={settingsState.isPremium}
      detailCell={detailCell}
      detailDateKey={detailDateKey}
      isDetailLocked={isDetailLocked}
      showConfirmBtn={showConfirmBtn}
      memoText={memoText}
      statusLine={statusLine}
      isEditingMemo={isEditingMemo}
      memoDraft={memoDraft}
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      onSelectDate={setCalendarSelectedDateKey}
      onEditMemo={beginMemoEdit}
      onChangeMemo={setMemoDraft}
      onSaveMemo={saveMemo}
      onCancelEdit={handleCancelEdit}
      onMarkSuccess={handleMarkSuccess}
      onOpenTimeline={handleOpenTimeline}
    />
  );
}

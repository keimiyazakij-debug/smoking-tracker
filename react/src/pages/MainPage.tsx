import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSmokeMessage, getTodayCount, getYesterdayCount, getYesterdayKey } from '../domain/app';
import { getDateKey, parseDateKey } from '../domain/date';
import { useSmokingIntervals } from '../hooks/useSmokingIntervals';
import { useLogsContext } from '../state/logs/LogsContext';
import { useSettingsContext } from '../state/settings/SettingsContext';
import { isPremium as isPremiumSelector } from '../state/settings/settingsSelectors';
import { MainPageView } from './main/MainPageView';

export function MainPage() {
  const { state: logsState, dispatch: logsDispatch } = useLogsContext();
  const { state: settingsState } = useSettingsContext();
  const isPremium = isPremiumSelector(settingsState);
  const navigate = useNavigate();
  const todayKey = getDateKey(new Date());
  const todayCount = getTodayCount(logsState.logs, todayKey);
  const yesterdayCount = getYesterdayCount(logsState.logs, todayKey);
  const smokingIntervals = useSmokingIntervals(logsState.logs, settingsState.settings, isPremium);
  const [smokeHelp, setSmokeHelp] = useState('');

  const diffText = useMemo(() => {
    if (yesterdayCount == null) return { text: '昨日の記録なし', className: '' };
    const diff = todayCount - yesterdayCount;
    if (diff > 0) return { text: `昨日より +${diff}本`, className: 'diff-positive' };
    if (diff < 0) return { text: `昨日より ${diff}本`, className: 'diff-negative' };
    return { text: '昨日と同じ', className: '' };
  }, [todayCount, yesterdayCount]);

  const target = settingsState.settings.dailyTarget;
  const progress = Math.min(100, target > 0 ? (todayCount / target) * 100 : 0);

  const yesterdayKey = getYesterdayKey(todayKey);
  const showYesterdaySuccessBtn = logsState.logs[yesterdayKey] === undefined;

  const handleAdd = () => {
    logsDispatch({ type: 'ADD_SMOKE' });
    setSmokeHelp(buildSmokeMessage(todayCount + 1, target));
  };

  const handleUndo = () => logsDispatch({ type: 'UNDO_LAST_SMOKE' });

  const handleMarkYesterdaySuccess = () => {
    const d = parseDateKey(todayKey);
    d.setDate(d.getDate() - 1);
    logsDispatch({ type: 'MARK_SUCCESS', dateKey: getDateKey(d) });
  };

  const handleOpenTimeline = () => navigate(`/timeline?date=${todayKey}&from=home&sourceDate=${todayKey}`);

  return (
    <MainPageView
      todayKey={todayKey}
      todayCount={todayCount}
      target={target}
      diffText={diffText}
      progress={progress}
      smokeHelp={smokeHelp}
      showYesterdaySuccessBtn={showYesterdaySuccessBtn}
      currentMinutes={smokingIntervals.currentMinutes}
      bestMinutes={smokingIntervals.bestMinutes}
      todayLongestMinutes={smokingIntervals.todayLongestMinutes}
      nextTarget={smokingIntervals.nextTarget}
      isInitialState={smokingIntervals.isInitialState}
      achievements={smokingIntervals.achievements}
      onAdd={handleAdd}
      onUndo={handleUndo}
      onMarkYesterdaySuccess={handleMarkYesterdaySuccess}
      onOpenTimeline={handleOpenTimeline}
    />
  );
}

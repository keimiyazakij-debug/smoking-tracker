import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSmokeMessage, getTodayCount, getYesterdayCount, getYesterdayKey } from '../domain/app';
import { getDateKey, parseDateKey } from '../domain/date';
import { useSmokingIntervals } from '../hooks/useSmokingIntervals';
import { useAppContext } from '../state/AppContext';
import { SmokingIntervalCard } from '../components/main/SmokingIntervalCard';
import { TodayStatusCard } from '../components/main/TodayStatusCard';
import { SmokeActionCard } from '../components/main/SmokeActionCard';
import { HistoryCTA } from '../components/main/HistoryCTA';

export function MainPage() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const todayKey = getDateKey(new Date());
  const todayCount = getTodayCount(state.logs, todayKey);
  const yesterdayCount = getYesterdayCount(state.logs, todayKey);
  const smokingIntervals = useSmokingIntervals(state.logs, state.settings);
  const [smokeHelp, setSmokeHelp] = useState('');

  const diffText = useMemo(() => {
    if (yesterdayCount == null) return { text: '昨日の記録なし', className: '' };
    const diff = todayCount - yesterdayCount;
    if (diff > 0) return { text: `昨日より +${diff}本`, className: 'diff-positive' };
    if (diff < 0) return { text: `昨日より ${diff}本`, className: 'diff-negative' };
    return { text: '昨日と同じ', className: '' };
  }, [todayCount, yesterdayCount]);

  const target = state.settings.dailyTarget;
  const progress = Math.min(100, target > 0 ? (todayCount / target) * 100 : 0);

  const yesterdayKey = getYesterdayKey(todayKey);
  const showYesterdaySuccessBtn = state.logs[yesterdayKey] === undefined;

  return (
    <div id="main" className="tab active">
      <div className="main-layout">
        <SmokingIntervalCard
          currentMinutes={smokingIntervals.currentMinutes}
          bestMinutes={smokingIntervals.bestMinutes}
          todayLongestMinutes={smokingIntervals.todayLongestMinutes}
          message={smokingIntervals.message}
        />

        <TodayStatusCard
          todayKey={todayKey}
          todayCount={todayCount}
          target={target}
          diffText={diffText}
          progress={progress}
        />

        <SmokeActionCard
          todayCount={todayCount}
          target={target}
          smokeHelp={smokeHelp}
          showYesterdaySuccessBtn={showYesterdaySuccessBtn}
          onAdd={() => {
            dispatch({ type: 'ADD_SMOKE' });
            setSmokeHelp(buildSmokeMessage(todayCount + 1, target));
          }}
          onUndo={() => dispatch({ type: 'UNDO_LAST_SMOKE' })}
          onMarkYesterdaySuccess={() => {
            const d = parseDateKey(todayKey);
            d.setDate(d.getDate() - 1);
            dispatch({ type: 'MARK_SUCCESS', dateKey: getDateKey(d) });
          }}
        />

        <HistoryCTA onOpenTimeline={() => navigate(`/timeline?date=${todayKey}&from=home&sourceDate=${todayKey}`)} />
      </div>
    </div>
  );
}

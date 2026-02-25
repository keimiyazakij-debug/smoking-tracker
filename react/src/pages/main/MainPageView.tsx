import { HistoryCTA } from '../../components/main/HistoryCTA';
import { SmokeActionCard } from '../../components/main/SmokeActionCard';
import { SmokingIntervalCard } from '../../components/main/SmokingIntervalCard';
import { TodayStatusCard } from '../../components/main/TodayStatusCard';

type DiffText = {
  text: string;
  className: string;
};

type Props = {
  todayKey: string;
  todayCount: number;
  target: number;
  diffText: DiffText;
  progress: number;
  smokeHelp: string;
  showYesterdaySuccessBtn: boolean;
  currentMinutes: number;
  bestMinutes: number;
  todayLongestMinutes: number;
  message: string;
  onAdd: () => void;
  onUndo: () => void;
  onMarkYesterdaySuccess: () => void;
  onOpenTimeline: () => void;
};

export function MainPageView({
  todayKey,
  todayCount,
  target,
  diffText,
  progress,
  smokeHelp,
  showYesterdaySuccessBtn,
  currentMinutes,
  bestMinutes,
  todayLongestMinutes,
  message,
  onAdd,
  onUndo,
  onMarkYesterdaySuccess,
  onOpenTimeline,
}: Props) {
  return (
    <div id="main" className="tab active">
      <div className="main-layout">
        <SmokingIntervalCard currentMinutes={currentMinutes} bestMinutes={bestMinutes} todayLongestMinutes={todayLongestMinutes} message={message} />

        <TodayStatusCard todayKey={todayKey} todayCount={todayCount} target={target} diffText={diffText} progress={progress} />

        <SmokeActionCard
          todayCount={todayCount}
          target={target}
          smokeHelp={smokeHelp}
          showYesterdaySuccessBtn={showYesterdaySuccessBtn}
          onAdd={onAdd}
          onUndo={onUndo}
          onMarkYesterdaySuccess={onMarkYesterdaySuccess}
        />

        <HistoryCTA onOpenTimeline={onOpenTimeline} />
      </div>
    </div>
  );
}

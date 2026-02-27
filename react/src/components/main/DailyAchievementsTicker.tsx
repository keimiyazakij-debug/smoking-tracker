import { useEffect, useMemo, useState } from 'react';
import type { Achievement } from '../../hooks/useSmokingIntervals';

type Props = {
  achievements: Achievement[];
  onOpenSheet: () => void;
};

export function DailyAchievementsTicker({ achievements, onOpenSheet }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(() => document.visibilityState !== 'hidden');

  const active = useMemo(() => achievements[activeIndex] ?? achievements[0], [achievements, activeIndex]);

  useEffect(() => {
    const onVisibilityChange = () => setIsPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [achievements.length]);

  useEffect(() => {
    if (!isPageVisible || achievements.length < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % achievements.length);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [achievements.length, isPageVisible]);

  if (achievements.length === 0 || !active) {
    return (
      <div className="interval-achievement-ticker interval-achievement-ticker-placeholder" aria-hidden>
        <span className="interval-achievement-line"> </span>
      </div>
    );
  }

  return (
    <button type="button" className="interval-achievement-ticker" onClick={onOpenSheet} aria-label="今日の成果を表示">
      <span key={`${active.kind}-${active.occurredAt}`} className="interval-achievement-line">
        {active.label}
      </span>
      <span className="interval-achievement-hint" aria-hidden>›</span>
    </button>
  );
}

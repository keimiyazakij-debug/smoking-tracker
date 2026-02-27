import type { Target } from '../../hooks/useSmokingIntervals';

type Props = {
  target: Target | null;
  isInitialState: boolean;
};

function formatCompactHM(minutes: number): string {
  const safe = Math.max(0, minutes);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
}

export function NextTargetLine({ target, isInitialState }: Props) {
  return (
    <div className="interval-next-target" aria-live="polite">
      {isInitialState
        ? '記録を始めましょう'
        : target
          ? `あと${formatCompactHM(target.remainingMinutes)}で${target.label}（${formatCompactHM(target.targetMinutes)}）更新`
          : '自己ベスト更新中！'}
    </div>
  );
}

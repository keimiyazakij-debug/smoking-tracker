import type { ReactNode } from 'react';

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  titleNode?: ReactNode;
};

export function StatsBaseDateNavigator({ label, onPrev, onNext, disabled = false, titleNode = null }: Props) {
  return (
    <div id="stats-header">
      <button id="stats-prev" onClick={onPrev} disabled={disabled}>◀</button>
      <div className="stats-header-text">
        {titleNode}
        <span id="stats-label">{label}</span>
      </div>
      <button id="stats-next" onClick={onNext} disabled={disabled}>▶</button>
    </div>
  );
}

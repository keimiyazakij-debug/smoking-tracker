import type { Achievement } from '../../hooks/useSmokingIntervals';

type Props = {
  open: boolean;
  achievements: Achievement[];
  onClose: () => void;
};

function formatOccurredAt(occurredAt: string): string {
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export function AchievementsSheet({ open, achievements, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="achievements-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="achievements-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievementsSheetTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="achievements-sheet-header">
          <h3 id="achievementsSheetTitle" className="achievements-sheet-title">今日の成果</h3>
          <button type="button" className="achievements-sheet-close" onClick={onClose} aria-label="閉じる">閉じる</button>
        </div>
        <ul className="achievements-sheet-list">
          {achievements.slice(0, 3).map((achievement) => (
            <li key={`${achievement.kind}-${achievement.occurredAt}`} className="achievements-sheet-item">
              <span className="achievements-sheet-item-label">{achievement.label}</span>
              <span className="achievements-sheet-item-time">{formatOccurredAt(achievement.occurredAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

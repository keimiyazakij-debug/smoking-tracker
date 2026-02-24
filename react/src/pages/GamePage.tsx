import { useAppContext } from '../state/AppContext';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type BadgeDef = {
  id: string;
  label: string;
  icon: string;
};

const BADGES: BadgeDef[] = [
  { id: 'time_24h', label: '24時間達成', icon: '⏱️' },
  { id: 'nosmoke_7d', label: '7日連続達成', icon: '🔥' },
  { id: 'nosmoke_30d', label: '30日連続達成', icon: '🏆' },
  { id: 'goal_streak_3', label: '3日連続目標達成', icon: '🎯' },
  { id: 'goal_streak_7', label: '7日連続目標達成', icon: '🎯' },
  { id: 'down_streak_3', label: '3日連続改善', icon: '📉' },
  { id: 'down_streak_7', label: '7日連続改善', icon: '📉' },
  { id: 'no_smoke_morning', label: '午前禁煙達成', icon: '🌅' },
  { id: 'no_smoke_day', label: '1日完全禁煙', icon: '🚭' },
];

export function GamePage() {
  const navigate = useNavigate();
  return (
    <div id="game" className="tab active">
      <h2 className="settings-page-title">ゲーミフィケーション</h2>
      <section className="settings-card game-hub-card">
        <button id="gameChallengeLink" className="text-link game-hub-link" onClick={() => navigate('/game/challenge')}>
          今日のチャレンジ
        </button>
      </section>
      <section className="settings-card game-hub-card">
        <button id="gameBadgeLink" className="text-link game-hub-link" onClick={() => navigate('/game/badges')}>
          バッジ一覧
        </button>
      </section>
    </div>
  );
}

export function GameChallengePage() {
  const navigate = useNavigate();
  return (
    <div id="gameChallenge" className="tab active">
      <header className="timeline-header">
        <button id="dcBack" type="button" onClick={() => navigate('/game')}>← 戻る</button>
        <span>今日のチャレンジ</span>
      </header>
      <div className="card game-subpage-card">
        <div className="daily-task-recommend">
          <div className="daily-task-recommend-title">今日の提案</div>
          <div id="dcRecommended" className="daily-task-recommend-label">午前中の1本を減らしてみる</div>
        </div>
        <div id="dcList" className="challenge-list">
          <div className="challenge-item">深夜の1本を控えてみる。</div>
          <div className="challenge-item">朝の1本を減らしてみる。</div>
          <div className="challenge-item">午後の1本を減らしてみる。</div>
        </div>
      </div>
    </div>
  );
}

export function GameBadgesPage() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const earned = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('badgeDone');
      if (!raw) return {} as Record<string, { earnedAt?: string }>;
      return JSON.parse(raw) as Record<string, { earnedAt?: string }>;
    } catch {
      return {} as Record<string, { earnedAt?: string }>;
    }
  }, [state.logs]);

  return (
    <div id="gameBadges" className="tab active">
      <header className="timeline-header">
        <button id="badgeBackBtn" type="button" onClick={() => navigate('/game')}>← 戻る</button>
        <span>バッジ一覧</span>
      </header>
      <div className="card game-subpage-card">
        <div id="allBadges">
          {BADGES.map((b) => {
            const hit = earned[b.id];
            return (
              <div key={b.id} className={`badge-card ${hit ? 'earned' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">{b.icon}</span>
                <span>{b.label}{hit ? '' : ' 🔒'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

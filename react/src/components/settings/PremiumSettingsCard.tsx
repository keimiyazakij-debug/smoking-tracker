type Props = {
  isPremium: boolean;
  onTogglePremium: (value: boolean) => void;
  showDebug?: boolean;
  showPlan?: boolean;
};

export function PremiumSettingsCard({ isPremium, onTogglePremium, showDebug = false, showPlan = true }: Props) {
  return (
    <>
      {showPlan ? (
        <section id="settingsPremiumCard" className="settings-card settings-premium-card">
          <h3 className="settings-section-title">利用プラン</h3>
          <div className="settings-item settings-item-plan">
            <span className="settings-item-label">現在のプラン</span>
            <div id="planInfo" className="settings-plan-info">{isPremium ? 'プレミアム' : '無料プラン'}</div>
          </div>
        </section>
      ) : null}

      {showDebug ? (
        <section id="settingsDebugSection" className="settings-card settings-debug-card">
          <h3 className="settings-section-title">開発者設定</h3>
          <label className="settings-item settings-item-debug">
            <span className="settings-item-label">プレミアムモード（デバッグ）</span>
            <span className="settings-debug-toggle-wrap">
              <input id="debugPremiumToggle" type="checkbox" checked={isPremium} onChange={(e) => onTogglePremium(e.target.checked)} />
              <span className="settings-debug-toggle-ui" />
            </span>
          </label>
        </section>
      ) : null}
    </>
  );
}

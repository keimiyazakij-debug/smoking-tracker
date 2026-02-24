type Props = {
  dailyTarget: number;
  onChangeTarget: (value: number) => void;
};

export function TargetSettingsCard({ dailyTarget, onChangeTarget }: Props) {
  return (
    <section className="settings-card">
      <h3 className="settings-section-title">目標設定</h3>
      <label className="settings-item settings-item-input">
        <span className="settings-item-label">1日の目標本数</span>
        <span className="settings-input-wrap">
          <input
            type="number"
            id="dailyTarget"
            className="setting-input"
            min={0}
            value={dailyTarget}
            onChange={(e) => onChangeTarget(Number(e.target.value || 0))}
          />
          <span className="settings-input-unit">本</span>
        </span>
      </label>
    </section>
  );
}

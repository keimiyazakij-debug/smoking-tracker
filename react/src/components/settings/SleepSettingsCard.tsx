import { TimeSelectField } from '../TimeSelectField';

type Props = {
  sleepStart: string | null;
  sleepEnd: string | null;
  onChangeSleep: (start: string | null, end: string | null) => void;
};

export function SleepSettingsCard({ sleepStart, sleepEnd, onChangeSleep }: Props) {
  return (
    <section className="settings-card">
      <h3 className="settings-section-title">睡眠時間（間隔計算から除外）</h3>
      <label className="settings-item settings-item-input">
        <span className="settings-item-label">通常の就寝時刻</span>
        <span className="settings-input-wrap">
          <TimeSelectField id="sleepStart" value={sleepStart} onChange={(next) => onChangeSleep(next, sleepEnd)} />
        </span>
      </label>
      <label className="settings-item settings-item-input">
        <span className="settings-item-label">通常の起床時刻</span>
        <span className="settings-input-wrap">
          <TimeSelectField id="sleepEnd" value={sleepEnd} onChange={(next) => onChangeSleep(sleepStart, next)} />
        </span>
      </label>
    </section>
  );
}

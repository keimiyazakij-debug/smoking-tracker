import { DataManagementCard } from '../../components/settings/DataManagementCard';
import { PremiumSettingsCard } from '../../components/settings/PremiumSettingsCard';
import { SettingsHeader } from '../../components/settings/SettingsHeader';
import { SleepSettingsCard } from '../../components/settings/SleepSettingsCard';
import { TargetSettingsCard } from '../../components/settings/TargetSettingsCard';

type Props = {
  isPremium: boolean;
  dailyTarget: number;
  sleepStart: string | null;
  sleepEnd: string | null;
  message: string;
  isDevMode: boolean;
  onTogglePremium: (value: boolean) => void;
  onChangeTarget: (value: number) => void;
  onChangeSleep: (sleepStart: string | null, sleepEnd: string | null) => void;
  onExport: () => void | Promise<void>;
  onImport: () => void | Promise<void>;
  onReset: () => void;
};

export function SettingsPageView({
  isPremium,
  dailyTarget,
  sleepStart,
  sleepEnd,
  message,
  isDevMode,
  onTogglePremium,
  onChangeTarget,
  onChangeSleep,
  onExport,
  onImport,
  onReset,
}: Props) {
  return (
    <div id="settings" className="tab active">
      <SettingsHeader title="設定" />
      <PremiumSettingsCard isPremium={isPremium} onTogglePremium={onTogglePremium} />
      <TargetSettingsCard dailyTarget={dailyTarget} onChangeTarget={onChangeTarget} />
      <SleepSettingsCard sleepStart={sleepStart} sleepEnd={sleepEnd} onChangeSleep={onChangeSleep} />
      <DataManagementCard message={message} onExport={onExport} onImport={onImport} onReset={onReset} />
      {isDevMode ? <PremiumSettingsCard isPremium={isPremium} onTogglePremium={onTogglePremium} showPlan={false} showDebug /> : null}
    </div>
  );
}

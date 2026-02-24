type Props = {
  title: string;
};

export function SettingsHeader({ title }: Props) {
  return <h2 className="settings-page-title">{title}</h2>;
}

type Props = {
  title: string;
};

export function StatsHeader({ title }: Props) {
  return <div id="stats-title">{title}</div>;
}

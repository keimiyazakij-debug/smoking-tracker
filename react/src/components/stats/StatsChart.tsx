import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';

export type StatsChartSeries = {
  name: string;
  values: number[];
};

type Props = {
  labels: string[];
  series: StatsChartSeries[];
  yMax: number;
  scrollable?: boolean;
  unit?: string;
};

function getMaxTicksLimit(total: number): number {
  if (total <= 12) return total;
  if (total <= 24) return 12;
  return 10;
}

export function StatsChart({ labels, series, yMax, scrollable = false, unit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'bar', number[], string> | null>(null);
  const chartDataKey = useMemo(() => {
    const seriesKey = series.map((s) => `${s.name}:${s.values.join('|')}`).join('__');
    return `${labels.join('|')}__${seriesKey}__${yMax}__${scrollable}__${unit ?? ''}`;
  }, [labels, series, yMax, scrollable, unit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const wrap = canvas.parentElement;
    const width = scrollable
      ? Math.max(640, labels.length * 52)
      : Math.max(320, wrap?.clientWidth || 0);

    canvas.width = width;
    canvas.height = 220;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: series.map((s) => ({
          label: unit ? `${s.name} (${unit})` : s.name,
          data: s.values,
          backgroundColor: '#0066FF',
          borderColor: '#0066FF',
          borderWidth: 1,
          borderRadius: 6,
        })),
      },
      options: {
        animation: false,
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              autoSkip: true,
              maxTicksLimit: getMaxTicksLimit(labels.length),
              color: '#6E6E6E',
              font: { size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            max: yMax,
            position: 'left',
            ticks: {
              precision: 1,
              maxTicksLimit: 5,
              color: '#6E6E6E',
              font: { size: 11 },
            },
            grid: {
              color: '#E6EDF9',
            },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [chartDataKey, labels.length, scrollable, yMax, labels, series, unit]);

  return (
    <div id="stats-chart-1-section" className="stats-chart-section" style={{ display: 'block' }}>
      <div id="stats-chart-1-wrap" className={`stats-chart-wrap ${scrollable ? 'is-scroll' : ''}`}>
        <canvas id="stats-chart-1" ref={canvasRef} />
      </div>
    </div>
  );
}

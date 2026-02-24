import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';

type Props = {
  data: any;
};

function getMaxTicksLimit(total: number): number {
  if (total <= 12) return total;
  if (total <= 24) return 12;
  return 10;
}

export function StatsChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'bar', number[], string> | null>(null);
  const chartDataKey = useMemo(
    () => `${data.chart.labels.join('|')}__${data.chart.values.join('|')}__${data.chart.yMax}__${data.chart.scrollable}`,
    [data.chart.labels, data.chart.values, data.chart.yMax, data.chart.scrollable],
  );

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
    const width = data.chart.scrollable
      ? Math.max(640, data.chart.labels.length * 52)
      : Math.max(320, wrap?.clientWidth || 0);

    canvas.width = width;
    canvas.height = 220;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.chart.labels,
        datasets: [
          {
            data: data.chart.values,
            backgroundColor: '#0066FF',
            borderColor: '#0066FF',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
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
              maxTicksLimit: getMaxTicksLimit(data.chart.labels.length),
              color: '#6E6E6E',
              font: { size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            max: data.chart.yMax,
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
  }, [chartDataKey, data.chart.labels.length, data.chart.scrollable, data.chart.yMax]);

  return (
    <div id="stats-chart-1-section" className="stats-chart-section" style={{ display: 'block' }}>
      <div id="stats-chart-1-wrap" className={`stats-chart-wrap ${data.chart.scrollable ? 'is-scroll' : ''}`}>
        <canvas id="stats-chart-1" ref={canvasRef} />
      </div>
    </div>
  );
}

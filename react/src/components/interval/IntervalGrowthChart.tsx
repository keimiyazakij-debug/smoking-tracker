import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { markerSymbols, type IntervalPoint } from '../../domain/interval';

type Props = {
  points: IntervalPoint[];
};

function formatHM(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
}

function getYMax(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 180) return 180;
  return Math.ceil((max + 30) / 30) * 30;
}

export function IntervalGrowthChart({ points }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'line', (number | null)[], string> | null>(null);
  const dataKey = useMemo(() => {
    const markerKey = points.map((point) => markerSymbols(point.markers)).join('|');
    const valuesKey = points.map((point) => `${point.maxGapMinutes}/${point.trendMinutes ?? ''}`).join('|');
    return `${points.map((point) => point.label).join('|')}__${valuesKey}__${markerKey}`;
  }, [points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = points.map((point) => point.label);
    const values = points.map((point) => point.maxGapMinutes);
    const trend = points.map((point) => point.trendMinutes ?? null);
    const markers = points.map((point) => markerSymbols(point.markers));

    const wrap = canvas.parentElement;
    const width = Math.max(360, (wrap?.clientWidth ?? 360), labels.length * 42);
    canvas.width = width;
    canvas.height = 260;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '日次最長',
            data: values,
            borderColor: '#1f6feb',
            backgroundColor: 'rgba(31, 111, 235, 0.12)',
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 4,
            pointBackgroundColor: '#1f6feb',
            fill: false,
          },
          {
            label: '7日トレンド',
            data: trend,
            borderColor: 'rgba(31, 111, 235, 0.35)',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      plugins: [
        {
          id: 'interval-marker-text',
          afterDatasetsDraw: (chart) => {
            const meta = chart.getDatasetMeta(0);
            const chartCtx = chart.ctx;
            chartCtx.save();
            chartCtx.font = '12px sans-serif';
            chartCtx.fillStyle = '#5b6a86';
            chartCtx.textAlign = 'center';
            markers.forEach((marker, i) => {
              if (!marker) return;
              const point = meta.data[i];
              if (!point) return;
              chartCtx.fillText(marker, point.x, point.y - 10);
            });
            chartCtx.restore();
          },
        },
      ],
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatHM(Number(ctx.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#657086',
              maxTicksLimit: 8,
              font: { size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            max: getYMax(values),
            grid: { color: '#e7edf6' },
            border: { display: false },
            ticks: {
              color: '#657086',
              callback: (value) => formatHM(Number(value)),
              maxTicksLimit: 6,
              font: { size: 11 },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [dataKey, points]);

  return (
    <div id="interval-chart-section" className="interval-chart-section">
      <div id="interval-chart-wrap" className="interval-chart-wrap">
        <canvas id="interval-chart" ref={canvasRef} />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildStatsState, normalizeGraphType } from '../domain/stats';
import { useAppContext } from '../state/AppContext';
import { moveBaseDate } from '../domain/date';
import Chart from 'chart.js/auto';
import type { GraphType, RangeType } from '../types/app';

function getMaxTicksLimit(total: number): number {
  if (total <= 12) return total;
  if (total <= 24) return 12;
  return 10;
}

export function StatsPage() {
  const { state } = useAppContext();
  const [statsRangeType, setStatsRangeType] = useState<RangeType>('week');
  const [statsGraphType, setStatsGraphType] = useState<GraphType>('primary');
  const [statsBaseDateISO, setStatsBaseDateISO] = useState(() => new Date().toISOString());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'bar', number[], string> | null>(null);

  const graphType = normalizeGraphType(statsGraphType, statsRangeType);
  useEffect(() => {
    setStatsGraphType((prev) => normalizeGraphType(prev, statsRangeType));
  }, [statsRangeType]);
  const stats = useMemo(
    () => buildStatsState(statsRangeType, graphType, new Date(statsBaseDateISO), state.logs, state.isPremium),
    [statsRangeType, graphType, statsBaseDateISO, state.logs, state.isPremium],
  );
  const chartDataKey = useMemo(
    () => `${stats.chart.labels.join('|')}__${stats.chart.values.join('|')}__${stats.chart.yMax}__${stats.chart.scrollable}`,
    [stats.chart.labels, stats.chart.values, stats.chart.yMax, stats.chart.scrollable],
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
    const width = stats.chart.scrollable
      ? Math.max(640, stats.chart.labels.length * 52)
      : Math.max(320, wrap?.clientWidth || 0);

    canvas.width = width;
    canvas.height = 220;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.chart.labels,
        datasets: [
          {
            data: stats.chart.values,
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
              maxTicksLimit: getMaxTicksLimit(stats.chart.labels.length),
              color: '#6E6E6E',
              font: { size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            max: stats.chart.yMax,
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
  }, [chartDataKey, stats.chart.labels.length, stats.chart.scrollable]);

  return (
    <div id="stats" className="tab active">
      <div className="card stats-summary-card">
        <div className="stats-summary-row">
          <div id="stats-current-total" className="stats-summary-item">合計: {stats.summary.total}本</div>
          <div id="stats-current-avg" className="stats-summary-item">
            {stats.summary.showPrev
              ? `前期間比較: ${stats.summary.diff && stats.summary.diff >= 0 ? '+' : ''}${stats.summary.diff ?? 0}本${stats.summary.percent ? ` (${stats.summary.percent}%)` : ''}`
              : '全期間'}
          </div>
        </div>
        <div className="stats-summary-row">
          <div id="stats-prev-total" className="stats-summary-item">{stats.summary.maxDate ? `最大: ${stats.summary.max}本（${stats.summary.maxDate}）` : ''}</div>
          <div id="stats-prev-avg" className="stats-summary-item">{stats.summary.minDate ? `最小: ${stats.summary.min}本（${stats.summary.minDate}）` : ''}</div>
        </div>
      </div>

      <div id="statsFreeNotice" className="stats-free-notice">
        {!state.isPremium ? '無料版では直近60日分のデータを表示しています' : ''}
      </div>

      <div className="card stats-controls-card">
        <div className="stats-section stats-row">
          <span className="stats-label">集計期間:</span>
          <div className="stats-range-buttons">
            {(['week', 'month', 'all'] as RangeType[]).map((r) => (
              <button key={r} id={`range-${r}`} className={statsRangeType === r ? 'is-active' : ''} onClick={() => setStatsRangeType(r)}>
                {r === 'week' ? '週' : r === 'month' ? '月' : '全期間'}
              </button>
            ))}
          </div>
        </div>
        <div className="stats-section stats-row">
          <span className="stats-label">集計種別:</span>
          <div className="stats-graph-buttons">
            {([
              { id: 'primary', label: statsRangeType === 'all' ? '月別' : '日別' },
              { id: 'hourly', label: '時間帯別' },
              { id: 'weekday', label: '曜日別' },
            ] as Array<{ id: GraphType; label: string }>).map((g) => (
              <button
                key={g.id}
                id={`graph-${g.id === 'primary' ? 'daily' : g.id}`}
                className={graphType === g.id ? 'is-active' : ''}
                disabled={g.id === 'weekday' && !stats.showWeekdayButton}
                onClick={() => setStatsGraphType(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card stats-chart-card">
        <div id="stats-total-highlight" className="stats-total-highlight">{stats.label}：<strong>{stats.summary.total}本</strong></div>
        <div id="stats-header">
          <button id="stats-prev" onClick={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, -1).toISOString())} disabled={!stats.showNavigation}>◀</button>
          <div className="stats-header-text">
            <div id="stats-title">{stats.title}</div>
            <span id="stats-label">{stats.label}</span>
          </div>
          <button id="stats-next" onClick={() => setStatsBaseDateISO(moveBaseDate(new Date(statsBaseDateISO), statsRangeType, 1).toISOString())} disabled={!stats.showNavigation}>▶</button>
        </div>

        <div id="stats-chart-1-section" className="stats-chart-section" style={{ display: 'block' }}>
          <div id="stats-chart-1-wrap" className={`stats-chart-wrap ${stats.chart.scrollable ? 'is-scroll' : ''}`}>
            <canvas id="stats-chart-1" ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

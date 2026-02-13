window.statsView = {
  chart: null,

  bind(controller) {
    document.getElementById('stats-prev').onclick  = () => controller.movePrev();
    document.getElementById('stats-next').onclick  = () => controller.moveNext();
    document.getElementById('range-week').onclick  = () => controller.changeRange('week');
    document.getElementById('range-month').onclick = () => controller.changeRange('month');
    document.getElementById('graph-daily').onclick = () => controller.changeGraph('daily');
    document.getElementById('graph-hourly').onclick = () => controller.changeGraph('hourly');
  },

  render(state) {
    const titleEl = document.getElementById('stats-title');
    const labelEl = document.getElementById('stats-label');
    const canvasEl = document.getElementById('stats-chart');
    const totalHighlightEl = document.getElementById('stats-total-highlight');
    const rangeWeekEl = document.getElementById('range-week');
    const rangeMonthEl = document.getElementById('range-month');
    const curTotalEl = document.getElementById('stats-current-total');
    const curAvgEl = document.getElementById('stats-current-avg');
    const prevTotalEl = document.getElementById('stats-prev-total');
    const prevAvgEl = document.getElementById('stats-prev-avg');
    const freeNoticeEl = document.getElementById('statsFreeNotice');
    if (!titleEl || !labelEl || !canvasEl) return;

    titleEl.textContent = state.title;
    labelEl.textContent = state.label;
    // Design System v1.0: 週/月 セグメントの選択状態
    if (rangeWeekEl && rangeMonthEl) {
      rangeWeekEl.classList.toggle('is-active', state.rangeType === 'week');
      rangeMonthEl.classList.toggle('is-active', state.rangeType === 'month');
    }
    // Design System v1.0: 合計値主表示
    if (totalHighlightEl && state.summary) {
      const periodLabel = state.rangeType === 'month' ? '今月合計' : '今週合計';
      totalHighlightEl.innerHTML = `${periodLabel} <strong>${state.summary.total}本</strong>`;
    }

    if (state.summary && curTotalEl && curAvgEl && prevTotalEl && prevAvgEl) {
      const avg = state.summary.avg.toFixed(1);
      const prevAvg = state.summary.prevAvg.toFixed(1);
      curTotalEl.textContent = `期間合計: ${state.summary.total}本`;
      curAvgEl.textContent = `期間平均: ${avg}本/日`;
      prevTotalEl.textContent = `前期間合計: ${state.summary.prevTotal}本`;
      prevAvgEl.textContent = `前期間平均: ${prevAvg}本/日`;
    }
    if (freeNoticeEl) {
      freeNoticeEl.textContent = state.freeNotice || '';
    }

    if (!this.chart) {
      const ctx = canvasEl.getContext('2d');
      const getStyle = window.getComputedStyle
        ? window.getComputedStyle.bind(window)
        : null;
      const rootStyle = getStyle
        ? getStyle(document.documentElement)
        : { getPropertyValue: () => '' };
      const primary = rootStyle.getPropertyValue('--primary').trim() || '#0066FF';
      const secondary = rootStyle.getPropertyValue('--text-secondary').trim() || '#6E6E6E';
      const grid = rootStyle.getPropertyValue('--card-bg').trim() || '#F8F8F8';
      this.chart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: state.labels,
          datasets: [{
            data: state.values,
            backgroundColor: primary,
            borderColor: primary,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: state.yMax,
              ticks: {
                precision: 0,
                maxTicksLimit: 4,
                font: { size: 12 },
                color: secondary
              },
              grid: {
                color: grid,
                drawBorder: false
              }
            },
            x: {
              ticks: {
                font: { size: 12 },
                color: secondary
              },
              grid: {
                display: false,
                drawBorder: false
              }
            }
          }
        }
      });
      return;
    }

    this.chart.data.labels = state.labels;
    this.chart.data.datasets[0].data = state.values;
    const getStyle = window.getComputedStyle
      ? window.getComputedStyle.bind(window)
      : null;
    const rootStyle = getStyle
      ? getStyle(document.documentElement)
      : { getPropertyValue: () => '' };
    const primary = rootStyle.getPropertyValue('--primary').trim() || '#0066FF';
    this.chart.data.datasets[0].backgroundColor = primary;
    this.chart.data.datasets[0].borderColor = primary;
    this.chart.options.scales.y.max = state.yMax;
    this.chart.update('none');
  }
};

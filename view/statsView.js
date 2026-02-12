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
    const curTotalEl = document.getElementById('stats-current-total');
    const curAvgEl = document.getElementById('stats-current-avg');
    const prevTotalEl = document.getElementById('stats-prev-total');
    const prevAvgEl = document.getElementById('stats-prev-avg');
    if (!titleEl || !labelEl || !canvasEl) return;

    titleEl.textContent = state.title;
    labelEl.textContent = state.label;

    if (state.summary && curTotalEl && curAvgEl && prevTotalEl && prevAvgEl) {
      const avg = state.summary.avg.toFixed(1);
      const prevAvg = state.summary.prevAvg.toFixed(1);
      curTotalEl.textContent = `期間合計: ${state.summary.total}本`;
      curAvgEl.textContent = `期間平均: ${avg}本/日`;
      prevTotalEl.textContent = `前期間合計: ${state.summary.prevTotal}本`;
      prevAvgEl.textContent = `前期間平均: ${prevAvg}本/日`;
    }

    if (!this.chart) {
      const ctx = canvasEl.getContext('2d');
      this.chart = new window.Chart(ctx, {
        type: 'bar',
        data: { labels: state.labels, datasets: [{ data: state.values }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: state.yMax,
              ticks: { precision: 0 }
            }
          }
        }
      });
      return;
    }

    this.chart.data.labels = state.labels;
    this.chart.data.datasets[0].data = state.values;
    this.chart.options.scales.y.max = state.yMax;
    this.chart.update('none');
  }
};

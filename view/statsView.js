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
    if (!titleEl || !labelEl || !canvasEl) return;

    titleEl.textContent = state.title;
    labelEl.textContent = state.label;

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

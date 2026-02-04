const Y_AXIS_MARGIN = 10;

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

  render(data, meta) {
    document.getElementById('stats-title').textContent = meta.title;
    document.getElementById('stats-label').textContent = meta.label;

    const labels = data.map(d =>
      meta.graphType === 'daily' ? d.x.slice(5) : `${d.x}時`
    );
    const values = data.map(d => d.y);
    const target = meta.target ?? 0;
    const maxValue = Math.max(0, ...values);
    const yMax = Math.max(maxValue, target) + Y_AXIS_MARGIN;

    if (!this.chart) {
      const ctx = document.getElementById('stats-chart').getContext('2d');
      this.chart = new window.Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: values }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: yMax,
              ticks: { precision: 0 }
            }
          }
        }
      });
      return;
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.options.scales.y.max = yMax;
    this.chart.update('none');
  }
};

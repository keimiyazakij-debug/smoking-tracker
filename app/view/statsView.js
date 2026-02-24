window.statsView = {
  charts: {},

  bind(controller) {
    const prevBtn = document.getElementById('stats-prev');
    const nextBtn = document.getElementById('stats-next');
    const weekBtn = document.getElementById('range-week');
    const monthBtn = document.getElementById('range-month');
    const allBtn = document.getElementById('range-all');
    const dailyBtn = document.getElementById('graph-daily');
    const hourlyBtn = document.getElementById('graph-hourly');
    const weekdayBtn = document.getElementById('graph-weekday');

    if (prevBtn) prevBtn.onclick = () => controller.movePrev();
    if (nextBtn) nextBtn.onclick = () => controller.moveNext();
    if (weekBtn) weekBtn.onclick = () => controller.changeRange('week');
    if (monthBtn) monthBtn.onclick = () => controller.changeRange('month');
    if (allBtn) allBtn.onclick = () => controller.changeRange('all');
    if (dailyBtn) dailyBtn.onclick = () => controller.changeGraph('primary');
    if (hourlyBtn) hourlyBtn.onclick = () => controller.changeGraph('hourly');
    if (weekdayBtn) weekdayBtn.onclick = () => controller.changeGraph('weekday');
  },

  render(state) {
    const titleEl = document.getElementById('stats-title');
    const labelEl = document.getElementById('stats-label');
    const totalHighlightEl = document.getElementById('stats-total-highlight');
    const rangeWeekEl = document.getElementById('range-week');
    const rangeMonthEl = document.getElementById('range-month');
    const rangeAllEl = document.getElementById('range-all');
    const dailyBtn = document.getElementById('graph-daily');
    const hourlyBtn = document.getElementById('graph-hourly');
    const weekdayBtn = document.getElementById('graph-weekday');
    const curTotalEl = document.getElementById('stats-current-total');
    const curAvgEl = document.getElementById('stats-current-avg');
    const prevTotalEl = document.getElementById('stats-prev-total');
    const prevAvgEl = document.getElementById('stats-prev-avg');
    const freeNoticeEl = document.getElementById('statsFreeNotice');
    const prevBtn = document.getElementById('stats-prev');
    const nextBtn = document.getElementById('stats-next');

    if (titleEl) {
      titleEl.textContent = state.chart?.title || state.title || '';
    }
    if (labelEl) labelEl.textContent = state.label || '';

    if (rangeWeekEl) rangeWeekEl.classList.toggle('is-active', state.rangeType === 'week');
    if (rangeMonthEl) rangeMonthEl.classList.toggle('is-active', state.rangeType === 'month');
    if (rangeAllEl) rangeAllEl.classList.toggle('is-active', state.rangeType === 'all');

    if (dailyBtn) {
      dailyBtn.textContent = state.graphLabels?.primary || '日別';
      dailyBtn.classList.toggle('is-active', state.graphType === 'primary');
    }
    if (hourlyBtn) {
      hourlyBtn.textContent = state.graphLabels?.hourly || '時間帯別';
      hourlyBtn.classList.toggle('is-active', state.graphType === 'hourly');
    }
    if (weekdayBtn) {
      weekdayBtn.textContent = state.graphLabels?.weekday || '曜日別';
      weekdayBtn.disabled = !state.showWeekdayButton;
      weekdayBtn.classList.toggle('is-active', state.graphType === 'weekday');
    }

    if (prevBtn) prevBtn.style.visibility = state.showNavigation ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = state.showNavigation ? 'visible' : 'hidden';

    if (totalHighlightEl && state.summary) {
      const prefix = state.rangeType === 'week'
        ? '今週合計'
        : state.rangeType === 'month'
          ? '今月合計'
          : '全期間合計';
      totalHighlightEl.innerHTML = `${prefix} <strong>${state.summary.total}本</strong>`;
    }

    if (curTotalEl && state.summary) {
      curTotalEl.textContent = `合計: ${state.summary.total}本`;
    }

    if (curAvgEl && state.summary) {
      if (state.summary.showPrev) {
        if (state.summary.percent === null) {
          curAvgEl.textContent = `前期間比較: ${state.summary.diff >= 0 ? '+' : ''}${state.summary.diff}本`;
        } else {
          curAvgEl.textContent = `前期間比較: ${state.summary.diff >= 0 ? '+' : ''}${state.summary.diff}本 (${state.summary.percent}%)`;
        }
      } else {
        curAvgEl.textContent = '前期間比較: -';
      }
    }

    if (prevTotalEl && state.summary) {
      prevTotalEl.textContent = state.summary.maxDate
        ? `最大: ${state.summary.max}本（${state.summary.maxDate}）`
        : '最大: -';
    }
    if (prevAvgEl && state.summary) {
      prevAvgEl.textContent = state.summary.minDate
        ? `最小: ${state.summary.min}本（${state.summary.minDate}）`
        : '最小: -';
    }
    if (freeNoticeEl) {
      freeNoticeEl.textContent = state.freeNotice || '';
    }

    this.renderSection(1, state.chart || null);
    this.renderSection(2, null);
    this.renderSection(3, null);
  },

  renderSection(index, section) {
    const sectionEl = document.getElementById(`stats-chart-${index}-section`);
    const wrapEl = document.getElementById(`stats-chart-${index}-wrap`);
    const canvasEl = document.getElementById(`stats-chart-${index}`);
    if (!sectionEl || !wrapEl || !canvasEl) return;

    if (!section) {
      sectionEl.style.display = 'none';
      return;
    }

    sectionEl.style.display = 'block';
    wrapEl.classList.toggle('is-scroll', !!section.scrollable);

    if (section.scrollable) {
      const width = Math.max(640, (section.labels?.length || 1) * 56);
      canvasEl.style.width = `${width}px`;
    } else {
      canvasEl.style.width = '100%';
    }

    this.renderChart(index, canvasEl, section);
  },

  renderChart(index, canvasEl, section) {
    if (!window.Chart || !canvasEl?.getContext) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const primary = getCssVar('--primary', '#0066FF');
    const secondary = getCssVar('--text-secondary', '#6E6E6E');
    const grid = getCssVar('--card-bg', '#F8F8F8');
    const microTextSize = parseInt(getCssVar('--text-micro', '14'), 10) || 14;
    const xTickOptions = buildXAxisTickOptions(section.labels);

    const existing = this.charts[index];
    if (!existing) {
      this.charts[index] = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: section.labels,
          datasets: [{
            data: section.values,
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
              max: section.yMax,
              ticks: {
                precision: 1,
                maxTicksLimit: 5,
                font: { size: microTextSize },
                color: secondary
              },
              grid: {
                color: grid,
                drawBorder: false
              }
            },
            x: {
              ticks: {
                autoSkip: xTickOptions.autoSkip,
                maxTicksLimit: xTickOptions.maxTicksLimit,
                font: { size: microTextSize },
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

    existing.data.labels = section.labels;
    existing.data.datasets[0].data = section.values;
    existing.data.datasets[0].backgroundColor = primary;
    existing.data.datasets[0].borderColor = primary;
    existing.options.scales.y.max = section.yMax;
    existing.options.scales.y.ticks.color = secondary;
    existing.options.scales.y.ticks.font.size = microTextSize;
    existing.options.scales.x.ticks.color = secondary;
    existing.options.scales.x.ticks.font.size = microTextSize;
    existing.options.scales.x.ticks.autoSkip = xTickOptions.autoSkip;
    existing.options.scales.x.ticks.maxTicksLimit = xTickOptions.maxTicksLimit;
    existing.update('none');
  }
};

function buildXAxisTickOptions(labels) {
  const count = Array.isArray(labels) ? labels.length : 0;
  if (count <= 12) {
    return { autoSkip: false, maxTicksLimit: 12 };
  }
  if (count <= 24) {
    return { autoSkip: true, maxTicksLimit: 12 };
  }
  return { autoSkip: true, maxTicksLimit: 10 };
}

function getCssVar(name, fallback) {
  if (!window.getComputedStyle) return fallback;
  const style = window.getComputedStyle(document.documentElement);
  return style.getPropertyValue(name).trim() || fallback;
}

window.statsController = {
  state: {
    rangeType: 'week',      // week | month
    graphType: 'daily',     // daily | hourly
    baseDate: new Date()
  },

  init() {
    this.render();
  },

  changeRange(type) {
    this.state.rangeType = type;
    this.render();
  },

  changeGraph(type) {
    this.state.graphType = type;
    this.render();
  },

  movePrev() {
    this.state.baseDate = moveBaseDate(this.state.baseDate, this.state.rangeType, -1);
    this.render();
  },

  moveNext() {
    this.state.baseDate = moveBaseDate(this.state.baseDate, this.state.rangeType, 1);
    this.render();
  },
  render() {
    const { rangeType, graphType, baseDate } = this.state;
    const range =
      rangeType === 'week'
        ? getWeekRange(baseDate)
        : getMonthRange(baseDate);

    const raw = statsModel.aggregate({
      from: range.from,
      to: range.to,
      unit: graphType === 'daily' ? 'day' : 'hour'
    });

    const data =
      graphType === 'daily'
        ? fillDaily(range.from, range.to, raw)
        : fillHourly(raw);

    const title =
      (graphType === 'daily' ? '日別本数' : '時間帯別本数') +
      '（' +
      (rangeType === 'week' ? '1週間' : '1か月') +
      '）';  

    statsView.render(data, {
      title,
      label: buildLabel(rangeType, range),
      rangeType,
      graphType
    });
  }
};

/* ===== helper ===== */

function getWeekRange(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;

  const from = new Date(d);
  from.setDate(d.getDate() + diff);
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

function getMonthRange(baseDate) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();

  return {
    from: new Date(y, m, 1, 0, 0, 0, 0),
    to:   new Date(y, m + 1, 0, 23, 59, 59, 999)
  };
}

function moveBaseDate(baseDate, rangeType, dir) {
  const d = new Date(baseDate);
  rangeType === 'week'
    ? d.setDate(d.getDate() + dir * 7)
    : d.setMonth(d.getMonth() + dir);
  return d;
}

function fillDaily(from, to, raw) {
  const map = Object.fromEntries(raw.map(d => [d.x, d.y]));
  const out = [];

  const d = new Date(from);
  while (d <= to) {
    const key = d.toISOString().slice(0, 10);
    out.push({ x: key, y: map[key] || 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function fillHourly(raw) {
  const map = Object.fromEntries(raw.map(d => [d.x, d.y]));
  return Array.from({ length: 24 }, (_, h) => ({
    x: h,
    y: map[h] || 0
  }));
}

function buildLabel(rangeType, range) {
  const f = range.from.toISOString().slice(0, 10);
  const t = range.to.toISOString().slice(0, 10);
  return rangeType === 'week' ? `${f} – ${t}` : f.slice(0, 7);
}

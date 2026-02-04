window.statsController = {
  _initialized: false,

  state: {
    rangeType: 'week',      // week | month
    graphType: 'daily',     // daily | hourly
    baseDate: new Date()
  },

  init() {
    if (this._initialized) return;
    this._initialized = true;
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


    // 期間の dateKeys を作る（ここは既存実装）
    const dateKeys =
      rangeType === 'week'
        ? getWeekDateKeys(baseDate)
        : getMonthDateKeys(baseDate);

    const todayKey = window.common.getDateKey(new Date());

    let data;


    if (graphType === 'daily') {
      // ★ 日別：future を含めてそのまま表示（0 本）
      data = window.statsModel.aggregateDailyByDateKeys(dateKeys);
    } else {

      // ★ 時間帯別平均：future を除外
      const effectiveDateKeys = dateKeys.filter(k => k <= todayKey);
      data = window.statsModel.aggregateHourlyByDateKeys(effectiveDateKeys);
    }
    
    const title =
      graphType === 'daily'
        ? '日別本数'
        : '時間帯別平均本数';

    const label =
      rangeType === 'week'
        ? `${dateKeys[0]} – ${dateKeys[dateKeys.length - 1]}`
        : dateKeys[0].slice(0, 7);

    window.statsView.render(data, {
      title,
      label,
      rangeType,
      graphType,
      target: window.settingModel.loadSettings().dailyTarget
    });
  }
};  

/* ===== helper ===== */
function getWeekDateKeys(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0=日, 1=月, ...
  const diff = -day;      // 日曜始まり

  const start = new Date(d);
  start.setDate(d.getDate() + diff);

  const keys = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    keys.push(window.common.getDateKey(cur));
  }
  return keys;
}

function getMonthDateKeys(baseDate) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const keys = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) {
    keys.push(window.common.getDateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
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

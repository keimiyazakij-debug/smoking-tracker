window.statsController = {
  _initialized: false,

  state: {
    rangeType: 'week', // week | month | all
    graphType: 'primary', // primary | hourly | weekday
    baseDate: new Date()
  },

  init() {
    if (this._initialized) return;
    this._initialized = true;
    this.render();
  },

  changeRange(type) {
    this.state.rangeType = type;
    this.state.graphType = normalizeGraphType(this.state.graphType, type);
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
    const { rangeType, baseDate } = this.state;
    const logs = window.logModel.getLogs();

    const periodDateKeys = getPeriodDateKeys(rangeType, baseDate, logs);
    const recordedDateKeys = getRecordedKeys(logs, periodDateKeys);
    const prevRecordedDateKeys = getPrevRecordedDateKeys(rangeType, baseDate, logs, periodDateKeys);

    const summary = buildSummary(logs, recordedDateKeys, prevRecordedDateKeys, rangeType !== 'all');
    const graphMap = buildGraphMap({ rangeType, logs, periodDateKeys, recordedDateKeys });

    const graphType = normalizeGraphType(this.state.graphType, rangeType);
    this.state.graphType = graphType;

    const label = rangeType === 'all'
      ? buildAllLabel(recordedDateKeys)
      : `${periodDateKeys[0]} – ${periodDateKeys[periodDateKeys.length - 1]}`;

    const viewState = {
      rangeType,
      graphType,
      title: rangeType === 'all' ? '全期間の統計' : '期間統計',
      label,
      summary,
      chart: graphMap[graphType] || graphMap.primary,
      graphLabels: {
        primary: rangeType === 'all' ? '月別' : '日別',
        hourly: '時間帯別',
        weekday: '曜日別'
      },
      showWeekdayButton: rangeType !== 'week',
      showNavigation: rangeType !== 'all',
      freeNotice: typeof window.getIsPremium === 'function' && !window.getIsPremium()
        ? `無料版では直近${window.common.FREE_LIMIT_DAYS}日分のデータを表示しています`
        : ''
    };

    window.statsView.render(viewState);
  }
};

function normalizeGraphType(graphType, rangeType) {
  const allowed = rangeType === 'week'
    ? ['primary', 'hourly']
    : ['primary', 'hourly', 'weekday'];
  return allowed.includes(graphType) ? graphType : 'primary';
}

function getPeriodDateKeys(rangeType, baseDate, logs) {
  if (rangeType === 'all') {
    return Object.keys(logs || {})
      .sort()
      .filter((key) => !window.common?.isDateLocked || !window.common.isDateLocked(key));
  }

  const keys = rangeType === 'week'
    ? getWeekDateKeys(baseDate)
    : getMonthDateKeys(baseDate);
  return keys.filter((key) => !window.common?.isDateLocked || !window.common.isDateLocked(key));
}

function getRecordedKeys(logs, keys) {
  return (keys || []).filter((key) => Object.prototype.hasOwnProperty.call(logs || {}, key));
}

function getPrevRecordedDateKeys(rangeType, baseDate, logs, currentPeriodDateKeys) {
  if (rangeType === 'all') return [];
  const prevKeys = rangeType === 'week'
    ? shiftDateKeys(currentPeriodDateKeys, -7)
    : getMonthDateKeys(moveBaseDate(baseDate, rangeType, -1));
  const unlockedPrev = prevKeys.filter((key) => !window.common?.isDateLocked || !window.common.isDateLocked(key));
  return getRecordedKeys(logs, unlockedPrev);
}

function buildSummary(logs, recordedDateKeys, prevRecordedDateKeys, showPrev) {
  const values = recordedDateKeys.map((date) => ({
    date,
    count: Array.isArray(logs[date]) ? logs[date].length : 0
  }));

  const total = values.reduce((sum, item) => sum + item.count, 0);
  const maxObj = values.reduce((a, b) => (b.count > a.count ? b : a), { date: '', count: 0 });
  const minObj = values.reduce((a, b) => (b.count < a.count ? b : a), {
    date: '',
    count: Number.POSITIVE_INFINITY
  });

  const prevTotal = prevRecordedDateKeys.reduce((sum, date) => sum + ((logs[date] || []).length), 0);
  const diff = total - prevTotal;
  const percent = prevTotal > 0 ? ((diff / prevTotal) * 100).toFixed(1) : null;

  return {
    total,
    max: values.length > 0 ? maxObj.count : 0,
    maxDate: values.length > 0 ? maxObj.date : '',
    min: values.length > 0 ? minObj.count : 0,
    minDate: values.length > 0 ? minObj.date : '',
    showPrev,
    prevTotal: showPrev ? prevTotal : null,
    diff: showPrev ? diff : null,
    percent: showPrev ? percent : null
  };
}

function buildGraphMap({ rangeType, logs, periodDateKeys, recordedDateKeys }) {
  if (rangeType === 'week') {
    return {
      primary: buildChartSection('日別本数', buildDailySeries(periodDateKeys, logs), false),
      hourly: buildChartSection('時間帯別本数（合計）', buildHourSeries(recordedDateKeys, logs, false), false)
    };
  }

  if (rangeType === 'month') {
    return {
      primary: buildChartSection('日別本数', buildDailySeries(periodDateKeys, logs), false),
      hourly: buildChartSection('時間帯別本数（合計）', buildHourSeries(recordedDateKeys, logs, false), false),
      weekday: buildChartSection('曜日別平均本数', buildWeekdaySeries(recordedDateKeys, logs), false)
    };
  }

  return {
    primary: buildMonthChartSection(buildMonthSeries(recordedDateKeys, logs)),
    hourly: buildChartSection('時間帯別平均本数', buildHourSeries(recordedDateKeys, logs, true), false),
    weekday: buildChartSection('曜日別平均本数', buildWeekdaySeries(recordedDateKeys, logs), false)
  };
}

function buildMonthChartSection(series) {
  // データが少ない場合は約1年分を固定表示、長期の場合のみ横スクロール
  const scrollable = series.length > 12;
  return buildChartSection('月別本数', series, scrollable);
}

function buildChartSection(title, series, scrollable) {
  const labels = series.map((item) => item.label);
  const values = series.map((item) => item.value);
  const max = Math.max(0, ...values);
  return {
    title,
    labels,
    values,
    yMax: max <= 5 ? 5 : Math.ceil(max + 1),
    scrollable
  };
}

function buildDailySeries(dateKeys, logs) {
  return (dateKeys || []).map((date) => ({
    label: date.slice(5),
    value: Array.isArray(logs[date]) ? logs[date].length : 0
  }));
}

function buildMonthSeries(recordedDateKeys, logs) {
  const monthMap = {};
  (recordedDateKeys || []).forEach((date) => {
    const month = date.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = 0;
    monthMap[month] += Array.isArray(logs[date]) ? logs[date].length : 0;
  });

  const monthsWithData = Object.keys(monthMap).sort();
  const currentMonth = window.common.getDateKey(new Date()).slice(0, 7);
  const minStartMonth = addMonths(currentMonth, -11);
  const startMonth = monthsWithData.length > 0 && monthsWithData[0] < minStartMonth
    ? monthsWithData[0]
    : minStartMonth;

  const months = buildMonthKeys(startMonth, currentMonth);
  return months.map((month) => ({
    label: month,
    // データがない月は棒を描画しない
    value: Object.prototype.hasOwnProperty.call(monthMap, month) ? monthMap[month] : null
  }));
}

function buildHourSeries(recordedDateKeys, logs, asAverage) {
  const hourTotals = new Array(24).fill(0);
  (recordedDateKeys || []).forEach((date) => {
    (logs[date] || []).forEach((ts) => {
      const hour = new Date(ts).getHours();
      hourTotals[hour] += 1;
    });
  });
  const activeDays = recordedDateKeys.length;
  return hourTotals.map((count, hour) => ({
    label: `${hour}時`,
    value: asAverage && activeDays > 0 ? Math.round((count / activeDays) * 10) / 10 : count
  }));
}

function buildWeekdaySeries(recordedDateKeys, logs) {
  const weekdayTotals = new Array(7).fill(0);
  const weekdayCounts = new Array(7).fill(0);
  const labels = ['日', '月', '火', '水', '木', '金', '土'];

  (recordedDateKeys || []).forEach((date) => {
    const day = new Date(date).getDay();
    weekdayTotals[day] += (logs[date] || []).length;
    weekdayCounts[day] += 1;
  });

  return labels.map((label, i) => ({
    label,
    value: weekdayCounts[i] > 0
      ? Math.round((weekdayTotals[i] / weekdayCounts[i]) * 10) / 10
      : 0
  }));
}

function buildAllLabel(recordedDateKeys) {
  if (!recordedDateKeys || recordedDateKeys.length === 0) return '記録なし';
  return `${recordedDateKeys[0]} – ${recordedDateKeys[recordedDateKeys.length - 1]}`;
}

function getWeekDateKeys(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
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
  if (rangeType === 'all') return new Date(baseDate);
  const d = new Date(baseDate);
  if (rangeType === 'week') {
    d.setDate(d.getDate() + dir * 7);
    return d;
  }
  d.setMonth(d.getMonth() + dir);
  return d;
}

function shiftDateKeys(dateKeys, offsetDays) {
  return (dateKeys || []).map((key) => {
    const d = window.common.parseDateKey(key);
    d.setDate(d.getDate() + offsetDays);
    return window.common.getDateKey(d);
  });
}

function addMonths(monthKey, offset) {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthKeys(startMonth, endMonth) {
  const [startYear, startMon] = startMonth.split('-').map(Number);
  const [endYear, endMon] = endMonth.split('-').map(Number);
  const cursor = new Date(startYear, startMon - 1, 1);
  const end = new Date(endYear, endMon - 1, 1);
  const months = [];
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

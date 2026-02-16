// model/calendarModel.js

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth()
};

function setMonth(year, month) {
  state.year = year;
  state.month = month;
}

function prevMonth() {
  state.month--;
  if (state.month < 0) { state.month = 11; state.year--; }
}

function nextMonth() {
  state.month++;
  if (state.month > 11) { state.month = 0; state.year++; }
}

function resetToToday() {
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();
}

function buildCalendarData(logs, todayKey, dailyData = {}) {
  const map = {};
  if (Array.isArray(logs)) {
    logs.forEach(l => {
      map[l.date] = { count: l.count };
    });
  }

  if (dailyData && typeof dailyData === "object") {
    Object.keys(dailyData).forEach((key) => {
      const entry = dailyData[key];
      if (!map[key]) {
        map[key] = {
          count: Number.isInteger(entry?.count) ? entry.count : 0
        };
      }
      if (typeof entry?.memo === "string" && entry.memo.trim().length > 0) {
        map[key].memo = entry.memo;
      }
    });
  }

  const keys = Object.keys(map).sort();
  if (keys.length === 0) return {};
  
  const start = window.common.parseDateKey(keys[0]);
  const end = window.common.parseDateKey(
    todayKey || keys[keys.length - 1]
  );

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const key = window.common.getDateKey(d);
    if (!map[key]) {
      map[key] = { count: 0 };
    }
  }

  return Object.keys(map)
    .sort()
    .reduce((acc, k) => {
      acc[k] = map[k];
      return acc;
    }, {});
}


function buildCalendarState(ctx) {
  const logs = window.common.loadLogs();
  const target = window.settingModel.loadSettings().dailyTarget;
  const todayKey = window.appState.todayKey;

  const firstDay = new Date(state.year, state.month, 1).getDay();
  const lastDate = new Date(state.year, state.month + 1, 0).getDate();
  const prevLastDate = new Date(state.year, state.month, 0).getDate();

  return {
    ...state,
    logs,
    target,
    todayKey,
    firstDay,
    lastDate,
    prevLastDate
  };
}


window.calendarModel = {
  state,
  setMonth,
  prevMonth,
  nextMonth,
  resetToToday,
  buildCalendarData,
  buildCalendarState
};

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
      if (!l?.date) return;
      map[l.date] = {
        count: Number.isInteger(l.count) ? l.count : null,
        status: typeof l.status === "string" ? l.status : "unrecorded"
      };
    });
  }

  if (dailyData && typeof dailyData === "object") {
    Object.keys(dailyData).forEach((key) => {
      const memo = typeof dailyData[key] === "string" ? dailyData[key] : "";
      if (memo.trim().length === 0) return;
      if (!map[key]) {
        map[key] = {
          count: null,
          status: "unrecorded"
        };
      }
      map[key].memo = memo;
    });
  }

  return Object.keys(map)
    .sort()
    .reduce((acc, k) => {
      acc[k] = map[k];
      return acc;
    }, {});
}


function buildCalendarState(ctx) {
  const logs = window.logModel.getLogs();
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

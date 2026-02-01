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

function buildCalendarData(logs, todayKey) {
  if (!Array.isArray(logs) || logs.length === 0) return {};
  const map = {};
  logs.forEach(l => {
    map[l.date] = { count: l.count };
  });

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
  const todayKey = window.common.getDateKey();

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


// 日評価（純粋関数）
function evaluateDay({ count, prevCount, target, isPast }) {
  if (!isPast || prevCount == null) return null;
  if (count === 0) return "success";
  if (count < prevCount) return "down";
  if (count > prevCount) return "up";
  return "same";
}

// 前日の件数を取得（純粋関数）
function getPrevDayInfo(dateKey, calendarData) {
  if (!calendarData || !calendarData.hasOwnProperty(dateKey)) return null;
  const d = window.common.parseDateKey(dateKey);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const prevKey = `${y}-${m}-${day}`;

  if (!calendarData.hasOwnProperty(prevKey)) return null;
  return { key: prevKey, count: calendarData[prevKey].count };
}

window.calendarModel = {
  state,
  setMonth,
  prevMonth,
  nextMonth,
  resetToToday,
  buildCalendarData,
  buildCalendarState,
  evaluateDay,
  getPrevDayInfo
};

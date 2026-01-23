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


function buildCalendarData(ctx) {
  const logs = loadLogs();
  const target = loadSettings().dailyTarget;
  const todayKey = getDateKey();

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

function getPrevDayInfo(dateKey, logs) {
  const d = new Date(dateKey);
  d.setDate(d.getDate() - 1);
  const prevKey = getDateKey(d);
  if (!logs.hasOwnProperty(prevKey)) return null;
  return { key: prevKey, count: logs[prevKey].length };
}

window.calendarModel = {
  state,
  setMonth,
  prevMonth,
  nextMonth,
  resetToToday,
  buildCalendarData,
  evaluateDay,
  getPrevDayInfo
};

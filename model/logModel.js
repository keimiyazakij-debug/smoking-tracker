// model/logModel.js

const LOG_KEY = "dailyLogs";

function loadLogs() {
  return JSON.parse(localStorage.getItem(LOG_KEY)) || {};
}

function saveLogs(logs) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function addSmoke(date = new Date()) {
  const logs = loadLogs();
  const key = getDateKey(date);

  if (!logs[key]) logs[key] = [];
  logs[key].push(date.toISOString());

  saveLogs(logs);
}

function getLogs() {
  return loadLogs();
}

function getLastSmokeTime() {
  const logs = loadLogs();
  let last = null;

  Object.values(logs).forEach(times => {
    times.forEach(t => {
      const d = new Date(t);
      if (!last || d > last) last = d;
    });
  });

  return last;
}

function getConsecutiveLogDays() {
  const logs = loadLogs();

  // ログが1件以上ある日だけを抽出
  const dates = Object.keys(logs)
    .filter(k => Array.isArray(logs[k]) && logs[k].length > 0)
    .sort(); // YYYY-MM-DD 前提

  if (dates.length === 0) return 0;

  let streak = 1;
  let max = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    prev.setDate(prev.getDate() + 1);

    if (getDateKey(prev) === dates[i]) {
      streak++;
      max = Math.max(max, streak);
    } else {
      streak = 1;
    }
  }

  return max;
}

window.logModel = {
  addSmoke,
  getLogs,
  getLastSmokeTime,
  getConsecutiveLogDays
};

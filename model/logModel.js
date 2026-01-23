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

window.logModel = {
  addSmoke,
  getLogs,
  getLastSmokeTime
};

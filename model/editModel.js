// model/editModel.js

const editState = {
  sourceDateKey: null,
  dateKey: null,
  times: [],
  scopeHour: null,
  untouchedTimes: []
};

function open(dateKey, options = {}) {
  const hour = Number.isInteger(options.hour) && options.hour >= 0 && options.hour <= 23
    ? options.hour
    : null;
  editState.sourceDateKey = dateKey;
  editState.dateKey = dateKey;
  editState.scopeHour = hour;
  editState.untouchedTimes = [];

  const logs = window.common.loadLogs();
  const times = logs[dateKey] || [];

  const scopedTimes = [];
  times.forEach((t) => {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return;
    const formatted = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
    if (hour === null || d.getHours() === hour) {
      scopedTimes.push(formatted);
      return;
    }
    editState.untouchedTimes.push(t);
  });
  editState.times = scopedTimes;
}

function close() {
  editState.sourceDateKey = null;
  editState.dateKey = null;
  editState.times = [];
  editState.scopeHour = null;
  editState.untouchedTimes = [];
}

function addTime(time) {
  editState.times.push(time);
}

function updateTime(index, value) {
  editState.times[index] = value;
}

function removeTime(index) {
  editState.times.splice(index, 1);
}

function setDateKey(dateKey) {
  editState.dateKey = dateKey;
}

function buildNextLogs(targetDateKey = null) {
  const original = window.common.loadLogs();
  const logs = JSON.parse(JSON.stringify(original || {}));
  const targetDate = targetDateKey || editState.dateKey;
  const sourceDate = editState.sourceDateKey || targetDate;

  const newTimes = editState.times
    .filter(Boolean)
    .sort()
    .map(t => new Date(`${targetDate}T${t}:00`).toISOString());

  if (editState.scopeHour === null) {
    logs[targetDate] = newTimes;
    return logs;
  }

  if (targetDate === sourceDate) {
    logs[targetDate] = [...editState.untouchedTimes, ...newTimes].sort();
    return logs;
  }

  logs[sourceDate] = [...editState.untouchedTimes].sort();
  const targetExisting = logs[targetDate] || [];
  logs[targetDate] = [...targetExisting, ...newTimes].sort();
  return logs;
}

function hasChanges(targetDateKey = null) {
  const current = normalizeLogs(window.common.loadLogs());
  const next = normalizeLogs(buildNextLogs(targetDateKey));
  return JSON.stringify(current) !== JSON.stringify(next);
}

function normalizeLogs(logs) {
  const normalized = {};
  Object.keys(logs || {})
    .sort()
    .forEach((key) => {
      const value = Array.isArray(logs[key]) ? [...logs[key]].sort() : [];
      normalized[key] = value;
    });
  return normalized;
}

function save() {
  const logs = buildNextLogs(editState.dateKey);
  window.common.saveLogs(logs);
}

function getState() {
  return {
    dateKey: editState.dateKey,
    times: [...editState.times],
    scopeHour: editState.scopeHour
  };
}

window.editModel = {
  open,
  close,
  addTime,
  updateTime,
  removeTime,
  setDateKey,
  save,
  getState,
  hasChanges
};

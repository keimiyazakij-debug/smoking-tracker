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

function save() {
  const logs = window.common.loadLogs();
  const targetDate = editState.dateKey;
  const sourceDate = editState.sourceDateKey || targetDate;

  const newTimes = editState.times
    .filter(Boolean)
    .sort()
    .map(t => new Date(`${targetDate}T${t}:00`).toISOString());

  if (editState.scopeHour === null) {
    logs[targetDate] = newTimes;
    window.common.saveLogs(logs);
    return;
  }

  if (targetDate === sourceDate) {
    logs[targetDate] = [...editState.untouchedTimes, ...newTimes].sort();
    window.common.saveLogs(logs);
    return;
  }

  logs[sourceDate] = [...editState.untouchedTimes].sort();
  const targetExisting = logs[targetDate] || [];
  logs[targetDate] = [...targetExisting, ...newTimes].sort();
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
  getState
};

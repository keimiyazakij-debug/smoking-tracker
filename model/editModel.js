// model/editModel.js

const editState = {
  dateKey: null,
  times: []
};

function open(dateKey) {
  editState.dateKey = dateKey;

  const logs = loadLogs();
  const times = logs[dateKey] || [];

  editState.times = times.map(t => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  });
}

function close() {
  editState.dateKey = null;
  editState.times = [];
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

function save() {
  const logs = loadLogs();
  const date = editState.dateKey;

  const newTimes = editState.times
    .filter(Boolean)
    .sort()
    .map(t => new Date(`${date}T${t}:00`).toISOString());

  logs[date] = newTimes;
  saveLogs(logs);
}

function getState() {
  return {
    dateKey: editState.dateKey,
    times: [...editState.times]
  };
}

window.editModel = {
  open,
  close,
  addTime,
  updateTime,
  removeTime,
  save,
  getState
};

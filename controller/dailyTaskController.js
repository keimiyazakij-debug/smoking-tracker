(function () {

// controller/dailyTaskController.js

let currentDateKey = window.common.getDateKey();

function openToday() {
  currentDateKey = window.common.getDateKey();
  open(currentDateKey);
}

function open(dateKey) {
  currentDateKey = dateKey;
  const tasks = window.dailyTaskModel.getTasksForDate(dateKey);
  window.dailyTaskView.open(dateKey, tasks);
}

function move(diff) {
  const d = new Date(currentDateKey);
  d.setDate(d.getDate() + diff);
  const nextKey = window.common.getDateKey(d);
  if (nextKey > window.common.getDateKey()) return;

  open(nextKey);
}

function evaluate(ctx) {
  return window.dailyTaskModel.evaluate(ctx);
}

window.dailyTaskController = {
  openToday,
  open,
  move,
  evaluate
};

})();
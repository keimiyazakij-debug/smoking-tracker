(function () {

// controller/dailyTaskController.js

let currentDateKey = getDateKey();

function openToday() {
  currentDateKey = getDateKey();
  open(currentDateKey);
}

function open(dateKey) {
  currentDateKey = dateKey;
  const tasks = dailyTaskModel.getTasksForDate(dateKey);
  dailyTaskView.open(dateKey, tasks);
}

function move(diff) {
  const d = new Date(currentDateKey);
  d.setDate(d.getDate() + diff);
  const nextKey = getDateKey(d);
  if (nextKey > getDateKey()) return;

  open(nextKey);
}

function evaluate(ctx) {
  return dailyTaskModel.evaluate(ctx);
}

window.dailyTaskController = {
  openToday,
  open,
  move,
  evaluate
};

})();
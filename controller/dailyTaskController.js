(function () {

// controller/dailyTaskController.js
let currentDateKey = window.common.getDateKey();
let lastAchievedDateKey  = null;

function openToday() {
  currentDateKey = window.common.getDateKey();
  open(currentDateKey);
}

function open(dateKey) {
  currentDateKey = dateKey;
  const logs = window.common.loadLogs();
  const settings = window.appSettings || {}; 
  const ctx = window.common.buildContext({
    now: window.common.parseDateKey(dateKey),
    logs,
    settings,
    dateKey
  });
  evaluate(ctx);  
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
  // 純粋委譲のみ
  return window.dailyTaskModel.evaluate(ctx);
}

function checkAchievement(ctx) {
  // 今日が特定できない場合は何もしない
  if (!ctx || !ctx.todayKey) return;

  const stats = window.common.calculateStats(ctx);
  const achieved =
    stats.goalStreak > 0 ||
    stats.dailyStreak > 0 ||
    stats.downStreak > 0;

  // 同一日で既に通知済みなら何もしない
  if (!achieved || lastAchievedDateKey === ctx.todayKey) return;

  // 未通知の場合、Viewを開く
  const tasks = window.dailyTaskModel.getTasksForDate(ctx.todayKey);
  window.dailyTaskView.open(ctx.todayKey, tasks);

  // 通知済み日付を記録
  lastAchievedDateKey = ctx.todayKey;
}

window.dailyTaskController = {
  openToday,
  open,
  move,
  evaluate,
  checkAchievement
};

})();
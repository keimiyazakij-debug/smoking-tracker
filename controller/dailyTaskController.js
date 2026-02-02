(function () {

// controller/dailyTaskController.js
let currentDateKey = window.common.getDateKey();
let lastAchievedDateKey  = null;

function buildNowForDate(dateKey) {
  const todayKey = window.common.getDateKey(new Date());

  if (dateKey === todayKey) {
    return new Date(); // 今日：実時刻
  }

  // 過去日：その日の終了
  const d = window.common.parseDateKey(dateKey);
  d.setHours(23, 59, 59, 999);
  return d;
}

function openToday() {
  currentDateKey = window.common.getDateKey();
  open(currentDateKey);
}

function open(dateKey) {
  currentDateKey = dateKey;
  const logs = window.common.loadLogs();
  const settings = window.appSettings || {}; 
  const isToday = dateKey === window.common.getDateKey(new Date());

  const ctx = window.common.buildContext({
    now: buildNowForDate(dateKey),
    logs,
    settings,
    dateKey
  });
  const tasks = window.dailyTaskModel.evaluateTasks(ctx);
  window.dailyTaskView.open(dateKey, tasks);
}

function move(diff) {
  const d = new Date(currentDateKey);
  d.setDate(d.getDate() + diff);
  const nextKey = window.common.getDateKey(d);

  const todayKey = window.common.getDateKey(new Date());
  if (nextKey > todayKey) return;

  open(nextKey);
}

function evaluate(ctx) {
  // 純粋委譲のみ
  return window.dailyTaskModel.evaluate(ctx);
}

function checkAchievement(ctx) {
  if (!ctx || !ctx.todayKey) return;

  const stats = window.common.calculateStats(ctx);
  const achieved =
    stats.goalStreak > 0 ||
    stats.dailyStreak > 0 ||
    stats.downStreak > 0;

  if (!achieved || lastAchievedDateKey === ctx.todayKey) return;

  const tasks = window.dailyTaskModel.evaluateTasks(ctx);
  window.dailyTaskView.open(ctx.todayKey, tasks);

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
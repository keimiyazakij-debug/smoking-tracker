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
  const logs = window.logModel.getLogs();
  const settings = window.settingModel?.loadSettings
    ? window.settingModel.loadSettings()
    : (window.appSettings || {});
  const isToday = dateKey === window.common.getDateKey(new Date());

  const ctx = window.common.buildContext({
    now: buildNowForDate(dateKey),
    logs,
    settings,
    dateKey
  });
  const tasks = window.dailyTaskModel.evaluateTasks(ctx);
  // デイリータスク再設計: 3時間刻み分析を5区分に集約して提案を作る
  const recommendedTaskId = getRecommendedTaskId(dateKey, logs);
  const viewState = buildDailyTaskViewState(
    dateKey,
    tasks,
    isToday,
    recommendedTaskId
  );
  window.dailyTaskView.open(viewState);
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
  const logs = window.logModel.getLogs();
  const recommendedTaskId = getRecommendedTaskId(ctx.todayKey, logs);
  const viewState =
    buildDailyTaskViewState(
      ctx.todayKey,
      tasks,
      ctx.isToday,
      recommendedTaskId
    );
  window.dailyTaskView.open(viewState);

  lastAchievedDateKey = ctx.todayKey;
}

function refreshCurrentIfOpen() {
  if (!window.dailyTaskView.isOpen || !window.dailyTaskView.isOpen()) return;
  if (!currentDateKey) return;
  open(currentDateKey);
}

function buildDailyTaskViewState(dateKey, tasks, isToday, recommendedTaskId) {
  const todayKey = window.common.getDateKey();
  const recommendedTask = tasks.find(t => t.id === recommendedTaskId) || tasks[0] || null;
  return {
    dateKey,
    title: isToday ? "今日のチャレンジ" : `${dateKey} のチャレンジ`,
    tasks,
    // 今日の提案: 選択タスクを昇格表示
    recommendedTaskId: recommendedTask?.id || null,
    recommendedTaskLabel: recommendedTask?.label || "",
    canNext: dateKey < todayKey
  };
}

// 内部分析: 3時間刻み（0-3 ... 21-24）
function buildThreeHourBuckets(dateKey, logs) {
  const buckets = {
    "0_3": 0,
    "3_6": 0,
    "6_9": 0,
    "9_12": 0,
    "12_15": 0,
    "15_18": 0,
    "18_21": 0,
    "21_24": 0
  };
  const dayLogs = logs?.[dateKey] || [];
  dayLogs.forEach((ts) => {
    const d = new Date(ts);
    if (window.common.getDateKey(d) !== dateKey) return;
    const h = d.getHours();
    if (h < 3) buckets["0_3"] += 1;
    else if (h < 6) buckets["3_6"] += 1;
    else if (h < 9) buckets["6_9"] += 1;
    else if (h < 12) buckets["9_12"] += 1;
    else if (h < 15) buckets["12_15"] += 1;
    else if (h < 18) buckets["15_18"] += 1;
    else if (h < 21) buckets["18_21"] += 1;
    else buckets["21_24"] += 1;
  });
  return buckets;
}

// 表示集約: 深夜/朝/午前/午後/夜
function aggregateByAbstractTime(buckets) {
  return {
    deepNight: (buckets["0_3"] || 0) + (buckets["3_6"] || 0),
    morning: buckets["6_9"] || 0,
    lateMorning: buckets["9_12"] || 0,
    afternoon: (buckets["12_15"] || 0) + (buckets["15_18"] || 0),
    night: (buckets["18_21"] || 0) + (buckets["21_24"] || 0)
  };
}

function mapPeriodToTask(period) {
  const map = {
    deepNight: "deep_night_reduce",
    morning: "morning_reduce",
    lateMorning: "late_morning_reduce",
    afternoon: "afternoon_reduce",
    night: "night_reduce"
  };
  return map[period] || "morning_reduce";
}

function getRecommendedTaskId(dateKey, logs) {
  const buckets = buildThreeHourBuckets(dateKey, logs);
  const totals = aggregateByAbstractTime(buckets);

  const entries = Object.entries(totals)
    // 深夜は2本未満なら候補から除外
    .filter(([period]) => period !== "deepNight" || totals.deepNight >= 2)
    .sort((a, b) => b[1] - a[1]);
  const maxPeriod = entries.length > 0 ? entries[0][0] : "morning";

  return mapPeriodToTask(maxPeriod);
}

window.dailyTaskController = {
  openToday,
  open,
  move,
  evaluate,
  checkAchievement,
  refreshCurrentIfOpen
};

})();

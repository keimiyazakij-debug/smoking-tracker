// model/dailyTaskModel.js

const DAILY_DONE_KEY = "dailyDone";

// 今日のチャレンジの判定ロジック
const evaluators = {
  record(ctx) { return ctx.hasRecordToday === true;},
  minInterval(ctx, task) {
    return (
      typeof ctx.longestIntervalToday === "number" &&
      ctx.longestIntervalToday >= task.minutes
    );
  },
  timeband(ctx, task) { 
    if (!ctx.countBetween) return false;

    const count = ctx.countBetween(task.from, task.to);
    const smokeCount = typeof count === "number" ? count : 0;

    // 過去日
    if (!ctx.isToday) { return smokeCount === 0; }

    // 当日：判定可能時刻に未到達
    if (typeof ctx.nowHour !== "number" || ctx.nowHour < task.to) { return false; }

    return smokeCount === 0;
  }    
};

function loadDone() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_DONE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveDone(done) {
  localStorage.setItem(DAILY_DONE_KEY, JSON.stringify(done));
}

function ensureDate(done, dateKey) {
  if (!done[dateKey]) done[dateKey] = {};
}

function evaluate(ctx) {
  const done = loadDone();
  const dateKey = ctx.todayKey;
  ensureDate(done, dateKey);

  const events = [];

  window.DAILY_TASKS.forEach(task => {
    if (done[dateKey][task.id]) return;

    const evaluator = evaluators[task.rule];
    if (!evaluator) return;
    if (!evaluator(ctx, task)) return;

    done[dateKey][task.id] = true;
    events.push({
      type: "daily",
      dateKey,
      taskId: task.id
    });
  });

  if (events.length) saveDone(done);
  return events;
}

function getTasksForDate(dateKey) {
  const done = loadDone();
  ensureDate(done, dateKey);

  return window.DAILY_TASKS.map(t => ({
    id: t.id,
    label: t.label,
    done: !!done[dateKey][t.id]
  }));
}

window.dailyTaskModel = {
  evaluate,
  getTasksForDate
};

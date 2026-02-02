// model/dailyTaskModel.js

const DAILY_DONE_KEY = "dailyDone";

// 今日のチャレンジの判定ロジック
const evaluators = {
  record(ctx) { return ctx.hasRecordToday === true;},
  minInterval(ctx, task) {
    const logsForDay = ctx.logs?.[ctx.todayKey] || [];
    const longest = calcLongestInterval(logsForDay);
    return typeof longest === "number" && longest >= task.minutes;
  },
  timeband(ctx, task) {
    const smokeCount = ctx.countBetween(task.from, task.to);

    // 時間帯が終了しているか
    const finished =
      !ctx.isToday || ctx.nowHour >= task.to;

    if (!finished) return false;

    return smokeCount === 0;
  }
};

function calcLongestInterval(logsForDay) {
  if (!Array.isArray(logsForDay) || logsForDay.length < 2) return null;

  let max = 0;
  for (let i = 1; i < logsForDay.length; i++) {
    const diff =
      (new Date(logsForDay[i]) - new Date(logsForDay[i - 1])) / 60000;
    if (diff > max) max = diff;
  }
  return Math.floor(max);
}

function evaluateTasks(ctx) {
  return window.DAILY_TASKS.map(task => {
    const evaluator = evaluators[task.rule];
    const done = evaluator ? evaluator(ctx, task) === true : false;

    return {
      id: task.id,
      label: task.label,
      done
    };
  });
}

function evaluate(ctx) {
  const dateKey = ctx.todayKey;

  return evaluateTasks(ctx)
    .filter(t => t.done)
    .map(t => ({
      type: "daily",
      dateKey,
      taskId: t.id
    }));
}

window.dailyTaskModel = {
  evaluate,
  evaluateTasks
};

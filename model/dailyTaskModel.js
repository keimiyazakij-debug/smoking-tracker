// model/dailyTaskModel.js

const DAILY_DONE_KEY = "dailyDone";

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

  DAILY_TASKS.forEach(task => {
    if (done[dateKey][task.id]) return;
    if (!task.check(ctx)) return;

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

  return DAILY_TASKS.map(t => ({
    id: t.id,
    label: t.label,
    done: !!done[dateKey][t.id]
  }));
}

window.dailyTaskModel = {
  evaluate,
  getTasksForDate
};

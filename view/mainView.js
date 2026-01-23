(function () {
// view/mainView.js

function render(ctx) {
  const s = loadSettings();

  document.getElementById("todayDisplay").textContent = ctx.todayKey;
  const count = Number.isInteger(ctx.todayCount) ? ctx.todayCount : 0;
  document.getElementById("todayCountDisplay").textContent =
    `${count} / ${s.dailyTarget} 本`;
  const pct = Math.min(100, count / s.dailyTarget * 100);

document.getElementById("progress").style.width = pct + "%";

  const sinceEl = document.getElementById("since");
  sinceEl.innerHTML = "";

  if (!ctx.lastSmokeAt) {
    sinceEl.textContent = "禁煙中（今日はまだ吸っていません）";
    return;
  }

  const hh = ctx.lastSmokeAt.getHours().toString().padStart(2,"0");
  const mm = ctx.lastSmokeAt.getMinutes().toString().padStart(2,"0");
  sinceEl.textContent =
    `禁煙中：${hh}時${mm}分から ${formatDurationFromMinutes(ctx.minutesFromLastSmoke)}経過`;
}

window.mainView = { render };

})();
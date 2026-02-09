(function () {
// view/mainView.js

function render(ctx) {
  const s = loadSettings();

  // 日付を表示
  document.getElementById("todayDisplay").textContent = ctx.todayKey;

  // 今日の本数を表示
  const count = Number.isInteger(ctx.todayCount) ? ctx.todayCount : 0;
  document.getElementById("todayCountDisplay").textContent = `${count} / ${s.dailyTarget} 本`;

  // プログレスバーを更新
  const pct = Math.min(100, count / s.dailyTarget * 100);
  document.getElementById("progress").style.width = pct + "%";

  // 戻すリンクの表示制御
  const undoWrap = document.getElementById("undoSmokeWrap");
  const undoBtn = document.getElementById("undoSmokeBtn");
  if (undoWrap && undoBtn) {
    if (count > 0) {
      undoWrap.style.display = "block";
      undoBtn.disabled = false;
    } else {
      undoWrap.style.display = "none";
      undoBtn.disabled = true;
    }
  }

  /* ===== ステータス行（意味づけ） ===== */
  const statusEl = document.getElementById("statusLine");
  if (statusEl && window.logModel?.getConsecutiveLogDays) {
    const logDays = logModel.getConsecutiveLogDays();

    if (logDays > 0) {
      statusEl.textContent = `📝 連続ログ記録：${logDays}日`;
    } else if (ctx.consecutiveNoSmokeDays >= 1) {
      statusEl.textContent = `🌱 禁煙${ctx.consecutiveNoSmokeDays}日継続中`;
    } else {
      statusEl.textContent = "";
    }
  }

  /* ===== since（事実表示） ===== */
  const sinceEl = document.getElementById("since");
  sinceEl.innerHTML = "";

  if (!ctx.lastSmokeAt) {
    sinceEl.textContent = "禁煙中（今日はまだ吸っていません）";
  }else{
    const hh = ctx.lastSmokeAt.getHours().toString().padStart(2,"0");
    const mm = ctx.lastSmokeAt.getMinutes().toString().padStart(2,"0");
    sinceEl.textContent =
      `禁煙中：${hh}時${mm}分から ${formatDurationFromMinutes(ctx.minutesFromLastSmoke)}経過`;
  }
}

window.mainView = { render };

})();

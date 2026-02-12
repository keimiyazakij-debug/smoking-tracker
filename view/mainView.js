(function () {
// view/mainView.js

function render(ctx) {
  const s = loadSettings();

  // 日付を表示
  document.getElementById("todayDisplay").textContent = ctx.todayKey;

  // 今日の本数を表示
  const count = Number.isInteger(ctx.todayCount) ? ctx.todayCount : 0;
  document.getElementById("todayCountDisplay").textContent = `${count} / ${s.dailyTarget} 本`;

  // 昨日との差分
  const diffEl = document.getElementById("yesterdayDiff");
  if (diffEl) {
    diffEl.classList.remove("diff-positive", "diff-negative");
    if (ctx.yesterdayCount == null) {
      diffEl.textContent = "昨日の記録なし";
    } else {
      const diff = count - ctx.yesterdayCount;
      if (diff > 0) {
        diffEl.textContent = `昨日より +${diff}本`;
        diffEl.classList.add("diff-positive");
      } else if (diff < 0) {
        diffEl.textContent = `昨日より ${diff}本`;
        diffEl.classList.add("diff-negative");
      } else {
        diffEl.textContent = "昨日と同じ";
      }
    }
  }

  // プログレスバーを更新
  const pct = Math.min(100, count / s.dailyTarget * 100);
  const progressEl = document.getElementById("progress");
  progressEl.style.width = pct + "%";
  progressEl.classList.remove("progress-green", "progress-yellow");
  if (count > s.dailyTarget) {
    progressEl.classList.add("progress-yellow");
  } else {
    progressEl.classList.add("progress-green");
  }

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

  // ステータス行（連続ログ日数）
  const statusLine = document.getElementById("statusLine");
  if (statusLine && window.logModel?.getConsecutiveLogDays) {
    const streak = window.logModel.getConsecutiveLogDays();
    statusLine.textContent = `📝 連続ログ記録：${streak}日`;
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

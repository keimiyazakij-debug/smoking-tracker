(function () {
// view/mainView.js

function render(ctx) {
  const s = loadSettings();
  const todayKey = ctx.todayKey;

  // 日付を表示
  document.getElementById("todayDisplay").textContent = todayKey;

  // 今日の本数を表示
  const count = Number.isInteger(ctx.todayCount) ? ctx.todayCount : 0;
  // Design System v1.0: 主数値(text-hero)と単位(text-caption)を分離
  const countEl = document.getElementById("todayCountDisplay");
  if (countEl) {
    countEl.textContent = String(count);
  }
  const unitEl = document.getElementById("todayCountUnit");
  if (unitEl) {
    unitEl.textContent = "本";
  }
  const targetEl = document.getElementById("todayTargetDisplay");
  if (targetEl) {
    targetEl.textContent = `目標 ${s.dailyTarget}本`;
  }

  // 直近7日平均・今週・先週
  const avgEl = document.getElementById("avg7Display");
  const thisWeekEl = document.getElementById("thisWeekDisplay");
  const lastWeekEl = document.getElementById("lastWeekDisplay");
  if (avgEl && thisWeekEl && lastWeekEl && window.logModel?.getLogs) {
    const logs = window.logModel.getLogs();
    const toKey = d => window.common.getDateKey(d);
    const countForKey = key => Array.isArray(logs[key]) ? logs[key].length : 0;
    const todayDate = window.common.parseDateKey(todayKey);

    // 直近7日平均（今日含む）
    let sum7 = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      sum7 += countForKey(toKey(d));
    }
    const avg7 = (sum7 / 7).toFixed(1);

    // 今週（日曜始まり）
    const dow = todayDate.getDay(); // 0: Sun
    const weekStart = new Date(todayDate);
    weekStart.setDate(weekStart.getDate() - dow);
    let thisWeekSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      thisWeekSum += countForKey(toKey(d));
    }

    // 先週
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let lastWeekSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeekStart);
      d.setDate(d.getDate() + i);
      lastWeekSum += countForKey(toKey(d));
    }

    avgEl.textContent = `直近7日平均: ${avg7}本/日`;
    thisWeekEl.textContent = `今週: ${thisWeekSum}本`;
    lastWeekEl.textContent = `先週: ${lastWeekSum}本`;
  }

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

  const successWrap = document.getElementById("yesterdaySuccessWrap");
  const logsForSuccess = window.logModel?.getLogs ? window.logModel.getLogs() : {};
  const todayDate = window.common.parseDateKey(todayKey);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const yesterdayKey = window.common.getDateKey(yesterdayDate);
  const showSuccessBtn = logsForSuccess?.[yesterdayKey] === undefined;
  if (successWrap) {
    successWrap.style.display = showSuccessBtn ? "block" : "none";
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

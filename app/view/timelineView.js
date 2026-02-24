(function () {
let currentTimelineDateKey = null;

// 日付の前後移動
const prevBtn = document.getElementById("prevTimelineDay");
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    window.timelineController.goPrevDay();
  });
}

const nextBtn = document.getElementById("nextTimelineDay");
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    window.timelineController.goNextDay();
  });
}

const backLink = document.getElementById("timelineBackLink");
if (backLink) {
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.timelineController?.goBack?.();
  });
}

const deleteAllBtn = document.getElementById("timelineDeleteAllBtn");
if (deleteAllBtn) {
  deleteAllBtn.addEventListener("click", () => {
    window.timelineController?.deleteAllForCurrentDate?.();
  });
}

  // ===== タイムライン画面の描画 =====
function renderTimelineForDate(map) {
  const container = document.getElementById("timelineList");
  if (!container) return;
  container.classList.remove("is-locked");
  container.innerHTML = "";

  // 0〜23時を必ず描画（4列×6行）
  for (let h = 0; h < 24; h++) {
    const cell = document.createElement("div");
    const count = map[h] ? map[h].length : 0;
    cell.className = `timeline-cell ${getHeatClass(count)}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.addEventListener("click", () => {
      // Design System v1.0: セルタップ時に選択サマリーを更新
      setSelectedSummary(currentTimelineDateKey, count);
      window.timelineController?.openEditForHour?.(h);
    });

    const hour = document.createElement("div");
    hour.className = "timeline-hour";
    // 時刻表記を 0時〜23時 に統一
    hour.textContent = `${h}時`;

    const log = document.createElement("div");
    log.className = "timeline-count";
    if (count === 0) {
      log.classList.add("empty");
      log.textContent = "";
    } else {
      log.textContent = `${count}本`;
    }

    btn.appendChild(hour);
    btn.appendChild(log);
    cell.appendChild(btn);
    container.appendChild(cell);
  }
}

function renderLocked(message) {
  const container = document.getElementById("timelineList");
  if (!container) return;
  container.classList.add("is-locked");
  container.innerHTML = "";

  const notice = document.createElement("div");
  notice.className = "timeline-locked-message";
  notice.textContent = message;
  container.appendChild(notice);
}

function getHeatClass(count) {
  // 本数に応じて濃淡（赤は使わない）
  if (count >= 4) return "count-4";
  if (count === 3) return "count-3";
  if (count === 2) return "count-2";
  if (count === 1) return "count-1";
  return "";
}

function setDateKey(dateKey) {
  currentTimelineDateKey = dateKey || null;
}

function setSelectedSummary(dateKey, count) {
  const el = document.getElementById("timelineSelectionSummary");
  if (!el || !dateKey) return;
  const dateText = String(dateKey).replaceAll("-", "/");
  const safeCount = Number.isInteger(count) ? count : 0;
  el.innerHTML = `${dateText} <strong>${safeCount}本</strong>`;
}

window.timelineView = {
  render: renderTimelineForDate,
  renderLocked,
  setDateKey,
  setSelectedSummary
};

})();

(function () {
let currentTimelineDateKey = null;

// DOMの書き換え
document.getElementById("openEditBtn").addEventListener("click", () => {
  window.timelineController.openEditFromTimeline();
});

// 日付の前後移動
document.getElementById("prevTimelineDay").addEventListener("click", () => {
  window.timelineController.goPrevDay();
});

document.getElementById("nextTimelineDay").addEventListener("click", () => {
  window.timelineController.goNextDay();
});

// モーダルの閉じる処理
document.getElementById("closeTimelineDetailBtn").addEventListener("click", () => {
  closeDetailModal();
});

document.getElementById("timelineDetailModal").addEventListener("click", (e) => {
  if (e.target.id === "timelineDetailModal") {
    closeDetailModal();
  }
});

  // ===== タイムライン画面の描画 =====
function renderTimelineForDate(map) {
  const container = document.getElementById("timelineList");
  if (!container) return;
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
      openDetailModal(h, map[h] || []);
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

function getHeatClass(count) {
  // 本数に応じて濃淡（赤は使わない）
  if (count >= 4) return "count-4";
  if (count === 3) return "count-3";
  if (count === 2) return "count-2";
  if (count === 1) return "count-1";
  return "";
}

function openDetailModal(hour, times) {
  const modal = document.getElementById("timelineDetailModal");
  const title = document.getElementById("timelineDetailTitle");
  const list = document.getElementById("timelineDetailList");
  title.textContent = `${hour}時の記録`;
  list.innerHTML = "";

  if (!times || times.length === 0) {
    const p = document.createElement("div");
    p.textContent = "記録はありません";
    list.appendChild(p);
  } else {
    times.forEach(t => {
      const row = document.createElement("div");
      row.textContent = t;
      list.appendChild(row);
    });
  }

  modal.classList.remove("hidden");
}

function closeDetailModal() {
  const modal = document.getElementById("timelineDetailModal");
  modal.classList.add("hidden");
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
  setDateKey,
  setSelectedSummary
};

})();

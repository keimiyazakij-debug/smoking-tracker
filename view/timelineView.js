(function () {

// DOMの書き換え
document.getElementById("openEditBtn").addEventListener("click", () => {
  window.timelineController.openEditFromTimeline();
});

document.getElementById("closeTimelineBtn").addEventListener("click", () => {
    window.timelineController.closeTimeline();
});

  // ===== タイムライン画面の描画 =====
function renderTimelineForDate(map) {
  const container = document.getElementById("timelineList");
  container.innerHTML = "";

  // 0〜23時を必ず描画
  for (let h = 0; h < 24; h++) {
    const row = document.createElement("div");
    row.className = "timeline-row";

    const hour = document.createElement("div");
    hour.className = "timeline-hour";
    hour.textContent = `${h}:00–${h+1}:00`;

    const log = document.createElement("div");
    log.className = "timeline-log";

    if (map[h]) {
      map[h].forEach(t => {
        const span = document.createElement("span");
        span.textContent = t;
        log.appendChild(span);
      });
    }

    container.appendChild(hour);
    container.appendChild(log);
  }
}

window.timelineView = { render: renderTimelineForDate };

})();

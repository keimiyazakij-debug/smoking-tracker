(function () {

let currentDateKey = null;

// DOMの書き換え
document.getElementById("openEditBtn").addEventListener("click", () => {
  if (!currentDateKey) return;
  window.timelineController.openEditFromTimeline();
});

document.getElementById("closeTimelineBtn").addEventListener("click", () => {
    window.timelineController.closeTimeline();
});

  // ===== タイムライン画面の描画 =====
function renderTimelineForDate(dateKey) {
  currentDateKey = dateKey;
  const container = document.getElementById("timelineList");
  container.innerHTML = "";

  const logs = loadLogs();
  const times = (logs[dateKey] || []).map(t => new Date(t));

  // 時間帯ごとに整理
  const map = {};
  times.forEach(t => {
    const h = t.getHours();
    const mm = t.getMinutes().toString().padStart(2,'0');
    const hh = h.toString().padStart(2,'0');
    if (!map[h]) map[h] = [];
    map[h].push(`${hh}:${mm}`);
  });

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
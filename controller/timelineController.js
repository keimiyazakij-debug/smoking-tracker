(function () {
let currentDateKey = null;

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey) {
  currentDateKey = dateKey;   // ★ 追加
  const overlay = document.getElementById("timelineOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  const map = buildTimelineMap(dateKey);
  window.timelineView.render(map);
}

// ===== タイムライン画面の再表示 =====
function refreshTimeline(dateKey) {
  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  const map = buildTimelineMap(dateKey);
  window.timelineView.render(map);
}

function refreshCurrent() {
  if (!currentDateKey) return;
  refreshTimeline(currentDateKey);
}

function buildTimelineMap(dateKey) {
  const logs = window.common.loadLogs();
  const times = logs[dateKey] || [];
  const map = {};

  times.forEach(t => {
    const d = new Date(t);
    if (window.common.getDateKey(d) !== dateKey) return;
    const h = d.getHours();
    const mm = d.getMinutes().toString().padStart(2,"0");
    const hh = h.toString().padStart(2,"0");
    if (!map[h]) map[h] = [];
    map[h].push(`${hh}:${mm}`);
  });

  Object.keys(map).forEach(h => map[h].sort());
  return map;
}


// ===== 編集画面を開く =====
function openEditFromTimeline() {
    if (!currentDateKey) return;
    window.editController.openEdit(currentDateKey);
}

// ===== タイムライン画面の非表示 =====
function closeTimeline() {
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
}

// ===== タイムライン画面の表示状態取得 =====
function isOpenTimeline(){
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    return true;
  }else{
    return false;
  }
}


window.timelineController = { 
  openTimeline,
  closeTimeline,
  openEditFromTimeline,
  refreshTimeline,
  refreshCurrent,
  isOpenTimeline
 };

 })();

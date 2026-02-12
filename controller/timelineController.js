(function () {
let currentDateKey = null;
let returnToMainOnSave = false;

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey, options = {}) {
  currentDateKey = dateKey;   // ★ 追加
  returnToMainOnSave = !!options.returnToMainOnSave;
  const overlay = document.getElementById("timelineOverlay");
  overlay.classList.remove("hidden");

  const map = buildTimelineMap(dateKey);
  updateTimelineHeader(dateKey, map);
  window.timelineView.render(map);
}

// ===== タイムライン画面の再表示 =====
function refreshTimeline(dateKey) {
  const map = buildTimelineMap(dateKey);
  updateTimelineHeader(dateKey, map);
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

function updateTimelineHeader(dateKey, map) {
  const title = document.getElementById("timelineTitle");
  const summary = document.getElementById("timelineSummary");
  const nextBtn = document.getElementById("nextTimelineDay");
  if (title) {
    title.textContent = `${dateKey.replaceAll("-", "/")}`;
  }
  if (summary) {
    const total = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
    summary.textContent = `合計 ${total}本`;
  }
  if (nextBtn) {
    const todayKey = window.common.getDateKey(new Date());
    nextBtn.style.visibility = dateKey >= todayKey ? "hidden" : "visible";
  }
}

function goPrevDay() {
  if (!currentDateKey) return;
  const d = window.common.parseDateKey(currentDateKey);
  d.setDate(d.getDate() - 1);
  const prevKey = window.common.getDateKey(d);
  currentDateKey = prevKey;
  refreshTimeline(prevKey);
}

function goNextDay() {
  if (!currentDateKey) return;
  const d = window.common.parseDateKey(currentDateKey);
  d.setDate(d.getDate() + 1);
  const nextKey = window.common.getDateKey(d);
  const todayKey = window.common.getDateKey(new Date());
  if (nextKey > todayKey) return;
  currentDateKey = nextKey;
  refreshTimeline(nextKey);
}


// ===== 編集画面を開く =====
function openEditFromTimeline() {
    if (!currentDateKey) return;
    window.editController.openEdit(currentDateKey, {
      returnToMainOnSave
    });
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
  isOpenTimeline,
  goPrevDay,
  goNextDay
 };

 })();

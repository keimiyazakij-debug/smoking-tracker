(function () {
let currentDateKey = null;
let returnToMainOnSave = false;
const LOCKED_MSG = "60日より前のデータはプレミアム版で閲覧できます。";

function isLocked(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey, options = {}) {
  currentDateKey = dateKey;   // ★ 追加
  returnToMainOnSave = !!options.returnToMainOnSave;
  if (typeof window.showTab === "function") {
    window.showTab("timeline");
  }

  if (isLocked(dateKey)) {
    renderLockedTimeline(dateKey);
    return;
  }

  const map = buildTimelineMap(dateKey);
  updateTimelineHeader(dateKey, map);
  if (window.timelineView?.setDateKey) {
    window.timelineView.setDateKey(dateKey);
  }
  if (window.timelineView?.setSelectedSummary) {
    const total = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
    window.timelineView.setSelectedSummary(dateKey, total);
  }
  window.timelineView.render(map);
}

// ===== タイムライン画面の再表示 =====
function refreshTimeline(dateKey) {
  if (isLocked(dateKey)) {
    renderLockedTimeline(dateKey);
    return;
  }

  const map = buildTimelineMap(dateKey);
  updateTimelineHeader(dateKey, map);
  if (window.timelineView?.setDateKey) {
    window.timelineView.setDateKey(dateKey);
  }
  if (window.timelineView?.setSelectedSummary) {
    const total = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
    window.timelineView.setSelectedSummary(dateKey, total);
  }
  window.timelineView.render(map);
}

function refreshCurrent() {
  if (!currentDateKey) return;
  refreshTimeline(currentDateKey);
}

// タブ直表示時に、未選択なら今日を表示
function ensureRendered() {
  if (!currentDateKey) {
    currentDateKey = window.common.getDateKey(new Date());
  }
  if (isLocked(currentDateKey)) {
    renderLockedTimeline(currentDateKey);
    return;
  }
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
  const todayKey = window.common.getDateKey(new Date());
  if (title) {
    title.textContent = `${dateKey.replaceAll("-", "/")}`;
  }
  if (summary) {
    const total = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
    summary.textContent = `合計 ${total}本`;
  }
  if (nextBtn) {
    nextBtn.style.visibility = dateKey >= todayKey ? "hidden" : "visible";
  }
}

function goPrevDay() {
  if (!currentDateKey) return;
  const d = window.common.parseDateKey(currentDateKey);
  d.setDate(d.getDate() - 1);
  const prevKey = window.common.getDateKey(d);
  if (isLocked(prevKey)) {
    // 無料版60日ロック: ロック日へは遷移せず、導線付きトーストのみ表示
    if (window.messageController?.enqueue) {
      window.messageController.enqueue({
        type: "premium_lock",
        text: LOCKED_MSG,
        priority: -1
      });
    }
    return;
  }
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
  if (isLocked(nextKey)) {
    // 無料版60日ロック: ロック日へは遷移せず、導線付きトーストのみ表示
    if (window.messageController?.enqueue) {
      window.messageController.enqueue({
        type: "premium_lock",
        text: LOCKED_MSG,
        priority: -1
      });
    }
    return;
  }
  currentDateKey = nextKey;
  refreshTimeline(nextKey);
}


// ===== 編集画面を開く =====
function openEditFromTimeline(hour = null) {
    if (!currentDateKey) return;
    if (isLocked(currentDateKey)) {
      if (window.messageController?.enqueue) {
        window.messageController.enqueue({
          type: "premium_lock",
          text: LOCKED_MSG,
          priority: -1
        });
      }
      return;
    }
    const options = {
      returnToMainOnSave
    };
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
      options.hour = hour;
    }
    window.editController.openEdit(currentDateKey, options);
}

function openEditForHour(hour) {
  openEditFromTimeline(hour);
}

function renderLockedTimeline(dateKey) {
  updateTimelineHeader(dateKey, {});
  const summary = document.getElementById("timelineSummary");
  if (summary) {
    summary.textContent = "この期間はプレミアム版で閲覧できます";
  }
  if (window.timelineView?.setDateKey) {
    window.timelineView.setDateKey(dateKey);
  }
  if (window.timelineView?.renderLocked) {
    window.timelineView.renderLocked(LOCKED_MSG);
  } else {
    window.timelineView.render({});
  }
}

// ===== タイムライン画面の非表示 =====
function closeTimeline() {
  // タブ版ではメインへ戻す（既存呼び出し互換）
  if (typeof window.showTab === "function") {
    window.showTab("main");
  }
}

// ===== タイムライン画面の表示状態取得 =====
function isOpenTimeline(){
  const tab = document.getElementById("timeline");
  return !!(tab && tab.classList.contains("active"));
}


window.timelineController = { 
  openTimeline,
  closeTimeline,
  openEditFromTimeline,
  openEditForHour,
  refreshTimeline,
  refreshCurrent,
  ensureRendered,
  isOpenTimeline,
  goPrevDay,
  goNextDay
 };

 })();

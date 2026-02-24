(function () {
let currentDateKey = null;
let routeSource = null; // "home" | "calendar" | null
let sourceDateKey = null;
const LOCKED_MSG = "60日より前のデータはプレミアム版で閲覧できます。";
const ROUTE_BASE_PATH = getRouteBasePath();

function buildHistoryState(dateKey) {
  return {
    view: "timeline",
    date: dateKey,
    from: routeSource,
    sourceDateKey
  };
}

function notifyPremiumLock() {
  if (window.messageController?.enqueue) {
    window.messageController.enqueue({
      type: "premium_lock",
      text: LOCKED_MSG,
      priority: -1
    });
  }
}

function isLocked(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

function resolveFrom(from) {
  if (from === "calendar") return "calendar";
  if (from === "home") return "home";
  return null;
}

function hasDrilldownContext() {
  return !!sourceDateKey && !!routeSource;
}

function buildTimelineUrl(dateKey) {
  if (!hasDrilldownContext()) {
    return `${ROUTE_BASE_PATH}?view=timeline`;
  }
  return `${ROUTE_BASE_PATH}?view=timeline&date=${dateKey}&from=${routeSource}`;
}

function updateBackLink() {
  const link = document.getElementById("timelineBackLink");
  if (!link) return;
  if (!hasDrilldownContext()) {
    link.style.display = "none";
    link.href = `${ROUTE_BASE_PATH}?view=timeline`;
    if (typeof window.updateLayoutHeights === "function") {
      window.updateLayoutHeights();
    }
    return;
  }
  link.style.display = "inline-block";

  if (routeSource === "calendar") {
    link.textContent = "← カレンダーに戻る";
    link.href = `${ROUTE_BASE_PATH}?view=calendar&date=${sourceDateKey}`;
    if (typeof window.updateLayoutHeights === "function") {
      window.updateLayoutHeights();
    }
    return;
  }
  link.textContent = "← メインに戻る";
  link.href = ROUTE_BASE_PATH;
  if (typeof window.updateLayoutHeights === "function") {
    window.updateLayoutHeights();
  }
}

function applyTimelineMap(dateKey, map) {
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

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey, options = {}) {
  currentDateKey = dateKey;
  const nextFrom = resolveFrom(options.from);
  const nextSourceDateKey =
    typeof options.sourceDateKey === "string" ? options.sourceDateKey : null;
  if (nextFrom && nextSourceDateKey) {
    routeSource = nextFrom;
    sourceDateKey = nextSourceDateKey;
  } else if (nextFrom === null && options.resetDrilldown === true) {
    routeSource = null;
    sourceDateKey = null;
  }

  const shouldUpdateHistory = options.updateHistory !== false;
  if (typeof window.showTab === "function") {
    window.showTab("timeline", { updateHistory: false });
  }
  updateBackLink();

  if (shouldUpdateHistory) {
    const url = buildTimelineUrl(dateKey);
    window.history.pushState(
      buildHistoryState(dateKey),
      "",
      url
    );
  }

  if (isLocked(dateKey)) {
    renderLockedTimeline(dateKey);
    return;
  }

  const map = buildTimelineMap(dateKey);
  applyTimelineMap(dateKey, map);
}

// ===== タイムライン画面の再表示 =====
function refreshTimeline(dateKey) {
  if (isLocked(dateKey)) {
    renderLockedTimeline(dateKey);
    return;
  }

  const map = buildTimelineMap(dateKey);
  applyTimelineMap(dateKey, map);
}

function refreshCurrent() {
  if (!currentDateKey) return;
  refreshTimeline(currentDateKey);
}

// 直接表示時に、未選択なら今日を表示
function ensureRendered(options = {}) {
  if (options.resetDrilldown === true) {
    routeSource = null;
    sourceDateKey = null;
  }
  if (typeof options.preferredDateKey === "string" && options.preferredDateKey) {
    currentDateKey = options.preferredDateKey;
  }
  if (!currentDateKey) {
    currentDateKey = window.common.getDateKey(new Date());
  }
  updateBackLink();
  window.history.replaceState(
    buildHistoryState(currentDateKey),
    "",
    buildTimelineUrl(currentDateKey)
  );
  if (isLocked(currentDateKey)) {
    renderLockedTimeline(currentDateKey);
    return;
  }
  refreshTimeline(currentDateKey);
}

function buildTimelineMap(dateKey) {
  const logs = window.logModel.getLogs();
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
  const deleteAllBtn = document.getElementById("timelineDeleteAllBtn");
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
  if (deleteAllBtn) {
    const logs = window.logModel.getLogs();
    const hasLogsEntry = Object.prototype.hasOwnProperty.call(logs, dateKey);
    deleteAllBtn.style.display = hasLogsEntry ? "inline-block" : "none";
  }
}

function goPrevDay() {
  if (!currentDateKey) return;
  const d = window.common.parseDateKey(currentDateKey);
  d.setDate(d.getDate() - 1);
  const prevKey = window.common.getDateKey(d);
  if (isLocked(prevKey)) {
    notifyPremiumLock();
    return;
  }
  currentDateKey = prevKey;
  window.history.replaceState(
    buildHistoryState(prevKey),
    "",
    buildTimelineUrl(prevKey)
  );
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
    notifyPremiumLock();
    return;
  }
  currentDateKey = nextKey;
  window.history.replaceState(
    buildHistoryState(nextKey),
    "",
    buildTimelineUrl(nextKey)
  );
  refreshTimeline(nextKey);
}

function goBack() {
  if (!hasDrilldownContext()) {
    return;
  }
  if (routeSource === "calendar") {
    const backDateKey = sourceDateKey;
    if (window.calendarController?.restoreViewState) {
      window.calendarController.restoreViewState();
    }
    if (typeof window.showTab === "function") {
      window.showTab("calendar", { updateHistory: false });
    }
    if (window.calendarController?.refresh) {
      window.calendarController.refresh();
    }
    window.history.replaceState(
      { view: "calendar", date: backDateKey },
      "",
      `${ROUTE_BASE_PATH}?view=calendar&date=${backDateKey}`
    );
    return;
  }

  if (typeof window.showTab === "function") {
    window.showTab("main", { updateHistory: false });
  }
  window.history.replaceState(
    { view: "main" },
    "",
    ROUTE_BASE_PATH
  );
}

function getRouteBasePath() {
  const path = window.location.pathname || "/";
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return normalized
    .replace(/index\.html\/?$/, "")
    .replace(/timeline\/?$/, "")
    .replace(/calendar\/?$/, "");
}

// ===== 編集画面を開く =====
function openEditFromTimeline(hour = null) {
  if (!currentDateKey) return;
  if (isLocked(currentDateKey)) {
    notifyPremiumLock();
    return;
  }
  const options = {};
  if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
    options.hour = hour;
  }
  window.editController.openEdit(currentDateKey, options);
}

function openEditForHour(hour) {
  openEditFromTimeline(hour);
}

function deleteAllForDate(dateKey) {
  if (!dateKey) return;
  const logs = window.logModel.getLogs();
  if (!Object.prototype.hasOwnProperty.call(logs, dateKey)) return;
  delete logs[dateKey];
  window.logModel.setLogs(logs);
  if (typeof window.onLogChanged === "function") {
    window.onLogChanged(dateKey);
  }
  refreshTimeline(dateKey);
}

function deleteAllForCurrentDate() {
  if (!currentDateKey) return;
  deleteAllForDate(currentDateKey);
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
  if (hasDrilldownContext()) {
    goBack();
    return;
  }
  if (typeof window.showTab === "function") {
    window.showTab("main", { updateHistory: false });
  }
  window.history.replaceState(
    { view: "main" },
    "",
    ROUTE_BASE_PATH
  );
}

// ===== タイムライン画面の表示状態取得 =====
function isOpenTimeline() {
  const tab = document.getElementById("timeline");
  return !!(tab && tab.classList.contains("active"));
}

window.timelineController = {
  openTimeline,
  closeTimeline,
  goBack,
  openEditFromTimeline,
  openEditForHour,
  deleteAllForDate,
  deleteAllForCurrentDate,
  refreshTimeline,
  refreshCurrent,
  ensureRendered,
  isOpenTimeline,
  goPrevDay,
  goNextDay
};

})();

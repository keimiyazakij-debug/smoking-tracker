(function () {

// controller/appController.js
const APP_ENTRY_PATH = (() => {
  const path = window.location.pathname || "/";
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return normalized.replace(/index\.html\/?$/, "");
})();

// 初期化処理
function bootstrap() {
  window.appState.todayKey = window.common.getDateKey(new Date());
  mainController.initMain();
  updateLayoutHeights();
  syncTabButtons("main");

  const earned = badgeModel.loadEarnedBadges();
  badgeView.render(earned);

  calendarController.showCalendar();
  onLogChanged();
  openInitialRoute();

  setInterval(() => {
    const activeTab = document.querySelector(".tab.active");
    if (activeTab?.id !== "main") return;
    onLogChanged();
  }, 60 * 1000);
}
document.addEventListener("DOMContentLoaded", bootstrap);

function openInitialRoute() {
  applyRouteFromLocation();
}

function updateLayoutHeights() {
  const root = document.documentElement;
  const header = document.querySelector("header");
  const nav = document.querySelector("nav");
  const calendarTab = document.getElementById("calendar");
  const timelineTab = document.getElementById("timeline");
  if (header) {
    root.style.setProperty("--header-height", `${header.offsetHeight}px`);
  }
  if (nav) {
    root.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
  }
  if (calendarTab && nav) {
    const calendarHeader = calendarTab.querySelector(".calendar-header");
    const calendarCard = calendarTab.querySelector(".calendar-card");
    const tabStyle = getComputedStyle(calendarTab);
    const cardStyle = calendarCard ? getComputedStyle(calendarCard) : null;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const topHeaderHeight = header ? header.offsetHeight : 0;
    const tabPaddingY =
      (parseFloat(tabStyle.paddingTop) || 0) + (parseFloat(tabStyle.paddingBottom) || 0);
    const cardPaddingY = cardStyle
      ? (parseFloat(cardStyle.paddingTop) || 0) + (parseFloat(cardStyle.paddingBottom) || 0)
      : 0;
    const monthHeaderHeight = calendarHeader ? calendarHeader.offsetHeight : 0;
    const sectionGap = parseFloat(getComputedStyle(root).getPropertyValue("--spacing-tight")) || 8;
    // 月ヘッダー/余白を引いた、calendar-grid の実利用可能高さ
    const gridHeight = Math.max(
      0,
      viewportHeight
        - topHeaderHeight
        - nav.offsetHeight
        - tabPaddingY
        - monthHeaderHeight
        - sectionGap
        - cardPaddingY
        - 1
    );
    root.style.setProperty("--calendar-grid-height", `${gridHeight}px`);
  }

  if (timelineTab) {
    const timelineHeader = timelineTab.querySelector(".timeline-header");
    const timelineHeaderHeight = timelineHeader ? timelineHeader.offsetHeight : 0;
    root.style.setProperty("--timeline-header-height", `${timelineHeaderHeight}px`);
  }

}

window.addEventListener("resize", updateLayoutHeights);
window.updateLayoutHeights = updateLayoutHeights;

// ログ更新時処理
function onLogChanged(date= null) {
  const logs = window.logModel.getLogs();
  if (window.dailyDataModel?.syncCountsFromLogs) {
    window.dailyDataModel.syncCountsFromLogs(logs);
  }
  const nowKey = window.common.getDateKey(new Date());
  const settings = window.settingModel.loadSettings();

  if (window.appState.todayKey !== nowKey) {
    window.appState.todayKey = nowKey;
    window.calendarModel.resetToToday();
  }  

  const ctx = window.common.buildContext({
    now: new Date(),
    logs,
    settings,
    dateKey: window.appState.todayKey
  });
  const targetDate = date ?? ctx.todayKey;
  const grouped = window.common.groupLogsByDate(logs);
  const logsForCalendar = grouped.map(d => ({
    date: d.date,
    count: d.smoke
  }));
//  const calendar = window.calendarModel.buildCalendarData( logsForCalendar, dateKey);

  const dailyEvents = window.dailyTaskController.evaluate(ctx);
  // 定期更新・初期描画では開かない
  if (!date) {
    dailyEvents.length = 0;
  }
  const badgeEvents = window.badgeController.updateBadges(ctx);

  // 過去日編集時はメッセージキューに入れない
  if (!date) {
    window.messageController.enqueue(dailyEvents, badgeEvents);
  }

  // タイムライン表示中でもメイン状態は最新化しておく
  window.mainView.render(ctx);
  if (window.timelineController.isOpenTimeline() === true) {
    if (date) {
      window.timelineController.openTimeline(date, { updateHistory: false });
    } else {
      window.timelineController.refreshCurrent();
    }
  }
  window.calendarController.refresh();
  window.badgeView.render();

  if (date && window._statsInitialized && window.statsController) {
    window.statsController.state.baseDate = new Date(date);
  }
  if (window._statsInitialized && window.statsController) {
    window.statsController.render();
  }

  if (window.editController?.isOpenEdit && window.editController.isOpenEdit()) {
    window.editController.refreshFromStorage();
  }
  if (window.dailyTaskController?.refreshCurrentIfOpen) {
    window.dailyTaskController.refreshCurrentIfOpen();
  }
}

function showTab(tabId, options = {}) {
  const shouldUpdateHistory = options.updateHistory !== false;
  const activeTab = document.querySelector(".tab.active");
  if (activeTab?.id === "calendar" && window.calendarController?.saveViewState) {
    window.calendarController.saveViewState();
  }

  document.querySelectorAll('.tab').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }
  // タブ切替直後に高さを再計算（display:none -> block 変化を反映）
  updateLayoutHeights();
  syncTabButtons(tabId);

  // ===== 統計タブ専用 =====
  if (tabId === 'stats') {
    if (!window._statsInitialized) {
      window.statsView.bind(statsController);
      window.statsController.init();
      window._statsInitialized = true;
    }
  }
  if (tabId === 'timeline' && window.timelineController?.ensureRendered) {
    const preferredDateKey =
      activeTab?.id === "calendar" && window.calendarController?.getSelectedDateKey
        ? window.calendarController.getSelectedDateKey()
        : null;
    window.timelineController.ensureRendered({
      resetDrilldown: options.resetTimelineContext === true,
      preferredDateKey
    });
  }
  if (tabId === "calendar" && window.calendarController?.restoreViewState) {
    window.calendarController.restoreViewState();
    window.calendarController.refresh();
  }
  if (shouldUpdateHistory && tabId !== "timeline") {
    window.history.replaceState({ view: tabId }, "", APP_ENTRY_PATH);
  }
}

// Design System v1.0: タブ選択色を同期
function syncTabButtons(activeTabId) {
  const resolvedTabId =
    activeTabId === "gameChallenge" || activeTabId === "gameBadges"
      ? "game"
      : activeTabId;
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    const isActive = btn.dataset.tab === resolvedTabId;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

// iOS対策
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const nowKey = window.common.getDateKey(new Date());
    if (window.appState.todayKey !== nowKey) {
      window.appState.todayKey = nowKey;
      window.calendarModel.resetToToday();
      window.calendarController.refresh();
    }
  }
});

window.showTab = showTab;
window.onLogChanged = onLogChanged;

window.addEventListener("logs-changed", () => onLogChanged());
window.addEventListener("storage", (e) => {
  if (e && e.key === "dailyLogs") onLogChanged();
});
window.addEventListener("popstate", (event) => {
  if (applyRouteFromLocation()) {
    return;
  }
  const nextView = event?.state?.view || "calendar";
  showTab(nextView, { updateHistory: false });
});

function parseRouteContext() {
  const params = new URLSearchParams(window.location.search);
  const viewFromQuery = params.get("view");
  const dateFromQuery = params.get("date");
  const fromRaw = params.get("from");
  const from = fromRaw === "calendar" || fromRaw === "home" ? fromRaw : null;
  const isTimelineRoute = viewFromQuery === "timeline";
  const isCalendarRoute = viewFromQuery === "calendar";
  const hasDrilldown = !!dateFromQuery && !!from;

  return {
    isTimelineRoute,
    isCalendarRoute,
    hasDrilldown,
    dateKey: dateFromQuery || window.common.getDateKey(new Date()),
    from
  };
}

function applyRouteFromLocation() {
  const route = parseRouteContext();
  if (route.isTimelineRoute) {
    window.timelineController?.openTimeline?.(route.dateKey, {
      from: route.hasDrilldown ? route.from : null,
      sourceDateKey: route.hasDrilldown ? route.dateKey : null,
      resetDrilldown: !route.hasDrilldown,
      updateHistory: false
    });
    return true;
  }
  if (route.isCalendarRoute) {
    showTab("calendar", { updateHistory: false });
    window.calendarController?.refresh?.();
    return true;
  }
  return false;
}

// ★ テスト用に公開
window.appController = { bootstrap,};

})();

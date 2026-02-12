(function () {

// controller/appController.js

// 初期化処理
function bootstrap() {
  window.appState.todayKey = window.common.getDateKey(new Date());
  mainController.initMain();
  updateLayoutHeights();

  const earned = badgeModel.loadEarnedBadges();
  badgeView.render(earned);

  calendarController.showCalendar();
  onLogChanged();

  setInterval(() => {
    onLogChanged();
  }, 60 * 1000);
}
document.addEventListener("DOMContentLoaded", bootstrap);

function updateLayoutHeights() {
  const root = document.documentElement;
  const header = document.querySelector("header");
  const nav = document.querySelector("nav");
  if (header) {
    root.style.setProperty("--header-height", `${header.offsetHeight}px`);
  }
  if (nav) {
    root.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
  }
}

window.addEventListener("resize", updateLayoutHeights);
window.updateLayoutHeights = updateLayoutHeights;

// ログ更新時処理
function onLogChanged(date= null) {
  const logs = window.logModel.getLogs();
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

  if (window.timelineController.isOpenTimeline() === true) {
    if (date) {
      window.timelineController.openTimeline(date);
    } else {
      window.timelineController.refreshCurrent();
    }
  } else {
    window.mainView.render(ctx);
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

function showTab(tabId) {
  if (window.timelineController.isOpenTimeline() == true){
    window.timelineController.closeTimeline();
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

  // ===== 統計タブ専用 =====
  if (tabId === 'stats') {
    if (!window._statsInitialized) {
      window.statsView.bind(statsController);
      window.statsController.init();
      window._statsInitialized = true;
    }
  }
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

// ★ テスト用に公開
window.appController = { bootstrap,};

})();

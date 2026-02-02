(function () {

// controller/appController.js

function bootstrap() {
  mainController.initMain();

  const earned = badgeModel.loadEarnedBadges();
  badgeView.render(earned);

  calendarController.showCalendar();
  onLogChanged();

  setInterval(() => {
    onLogChanged();
  }, 60 * 1000);
}
document.addEventListener("DOMContentLoaded", bootstrap);


document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();
});

function onLogChanged(date= null) {
  const logs = window.logModel.getLogs();
  const dateKey = window.common.getDateKey(new Date());
  const settings = window.settingModel.loadSettings();

  const ctx = window.common.buildContext({
    now: new Date(),
    logs,
    settings,
    dateKey
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

  window.messageController.enqueue(dailyEvents, badgeEvents);

  if (window.timelineController.isOpenTimeline() == true){
    window.timelineController.closeTimeline();
    window.timelineController.openTimeline(date);
  }
  window.mainView.render(ctx);
  window.calendarController.refresh();
  window.badgeView.render();
}

function showTab(tabId) {
  if (window.timelineController.isOpenTimeline() == true){
    window.timelineController.closeTimeline();
  }

  document.querySelectorAll('.tab').forEach(el => {
    el.style.display = 'none';
  });

  document.getElementById(tabId).style.display = 'block';

  // ===== 統計タブ専用 =====
  if (tabId === 'stats') {
    if (!window._statsInitialized) {
      window.statsView.bind(statsController);
      window.statsController.init();
      window._statsInitialized = true;
    }
  }
}

window.showTab = showTab;
window.onLogChanged = onLogChanged;

// ★ テスト用に公開
window.appController = { bootstrap,};

})();
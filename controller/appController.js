(function () {

// controller/appController.js

document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();

  // ★ 追加：保存済みバッジを即表示
  const earned = badgeModel.loadEarnedBadges();
  badgeView.render(earned);
    
  // ★ 追加：時間経過による再描画
  setInterval(() => {
    onLogChanged();
  }, 60 * 1000); // 1分ごと
});


document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();
});

function onLogChanged(date= null) {
  const logs = window.logModel.getLogs();
  const settings = window.settingModel.loadSettings();

  const ctx = window.common.buildContext({
    now: new Date(),
    logs,
    settings
  });
  const targetDate = date ?? ctx.todayKey;

  const calendar = window.calendarModel.buildCalendarData(ctx);

  const dailyEvents = window.dailyTaskController.evaluate(ctx);
  const badgeEvents = window.badgeController.updateBadges(ctx);

  window.messageController.enqueue(dailyEvents, badgeEvents);

  if (window.timelineController.isOpenTimeline() == true){
    window.timelineController.closeTimeline();
    window.timelineController.openTimeline(date);
  }
  window.mainView.render(ctx);
  window.calendarView.render(calendar);
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
}

window.showTab = showTab;
window.onLogChanged = onLogChanged;

})();
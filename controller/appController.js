(function () {

// controller/appController.js

document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();

  // ★ 追加：保存済みバッジを即表示
  const earned = badgeModel.loadEarnedBadges();
  badgeView.render(earned);
  calendarController.showCalendar();

   // ★ 初期描画はここで1回だけ
  onLogChanged();

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
}

window.showTab = showTab;
window.onLogChanged = onLogChanged;

})();
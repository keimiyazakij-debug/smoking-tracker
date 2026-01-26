(function () {

// controller/appController.js

document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();

  // ★ 追加：時間経過による再描画
  setInterval(() => {
    onLogChanged();
  }, 60 * 1000); // 1分ごと
});


document.addEventListener("DOMContentLoaded", () => {
  mainController.initMain();
});

function onLogChanged(date= null) {

  const ctx = buildContext();
  const targetDate = date ?? ctx.todayKey;

  const calendar = calendarModel.buildCalendarData(ctx);

  const dailyEvents = dailyTaskController.evaluate(ctx);
  const badgeEvents = badgeController.updateBadges(ctx);

  messageController.enqueue(dailyEvents, badgeEvents);

  if (timelineController.isOpenTimeline() == true){
    timelineController.closeTimeline();
    timelineController.openTimeline(date);
  }
  mainView.render(ctx);
  calendarView.render(calendar);
  badgeView.render();
}

function showTab(tabId) {
  if (timelineController.isOpenTimeline() == true){
    timelineController.closeTimeline();
  }

  document.querySelectorAll('.tab').forEach(el => {
    el.style.display = 'none';
  });

  document.getElementById(tabId).style.display = 'block';
}

window.showTab = showTab;
window.onLogChanged = onLogChanged;

})();
(function () {

// controller/mainController.js

function initMain() {
  document.getElementById("smokeBtn").onclick = addSmoke;
  const undoBtn = document.getElementById("undoSmokeBtn");
  if (undoBtn) undoBtn.onclick = undoLastSmoke;

  document.getElementById("dailyChallengeLink").onclick = () => {
    dailyTaskController.openToday();
  };

  const todayTimelineLink = document.getElementById("todayTimelineLink");
  if (todayTimelineLink) {
    todayTimelineLink.onclick = () => {
      const todayKey = window.common.getDateKey(new Date());
      window.timelineController.openTimeline(todayKey, {
        returnToMainOnSave: true
      });
    };
  }
}

function addSmoke() {
  window.logModel.addSmoke(new Date());
  onLogChanged();
}

function undoLastSmoke() {
  const dateKey = window.common.getDateKey(new Date());
  const removed = window.logModel.removeLastSmoke(dateKey);
  if (removed) {
    onLogChanged();
  }
}

window.mainController = { initMain };
window.addSmoke = addSmoke;

})();

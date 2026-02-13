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

let smokeLocked = false;
function addSmoke() {
  const btn = document.getElementById("smokeBtn");
  if (smokeLocked || !btn) return;
  smokeLocked = true;
  btn.disabled = true;

  window.logModel.addSmoke(new Date());
  if (typeof window.onLogChanged === "function") {
    window.onLogChanged();
  }

  updateSmokeHelp(buildSmokeMessage());
  pulseTodayCount();

  window.setTimeout(() => {
    smokeLocked = false;
    btn.disabled = false;
  }, 300);
}

function undoLastSmoke() {
  const dateKey = window.common.getDateKey(new Date());
  const removed = window.logModel.removeLastSmoke(dateKey);
  if (removed) {
    if (typeof window.onLogChanged === "function") {
      window.onLogChanged();
    }
  }
}

window.mainController = { initMain };
window.addSmoke = addSmoke;

function updateSmokeHelp(message) {
  const help = document.getElementById("smokeHelp");
  if (!help) return;
  if (message) help.textContent = message;
}

function pulseTodayCount() {
  const el = document.getElementById("todayCountDisplay");
  if (!el) return;
  el.classList.remove("count-pulse");
  void el.offsetWidth;
  el.classList.add("count-pulse");
}

function buildSmokeMessage() {
  const todayKey = window.common.getDateKey(new Date());
  const logs = window.logModel.getLogs();
  const todayCount = Array.isArray(logs[todayKey]) ? logs[todayKey].length : 0;
  const targetCount = window.settingModel.loadSettings().dailyTarget;

  const messagesBelow = [
    "目標以内です。いい流れです。",
    "今日もコントロールできています。",
    "順調です。このままいきましょう。"
  ];
  const messagesEqual = [
    "目標ラインです。ここからが大事。",
    "今日はここで止められると最高です。",
    "あと少し、整えていきましょう。"
  ];
  const messagesOver = [
    "記録できたことが前進です。",
    "大丈夫、また整えていきましょう。",
    "続けていること自体が大切です。"
  ];

  let pool = messagesOver;
  if (todayCount < targetCount) pool = messagesBelow;
  else if (todayCount === targetCount) pool = messagesEqual;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

})();

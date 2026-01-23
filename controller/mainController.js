(function () {

// controller/mainController.js

function initMain() {
  document.getElementById("smokeBtn").onclick = addSmoke;

  document.getElementById("dailyChallengeLink").onclick = () => {
    dailyTaskController.openToday();
  };
}

function addSmoke() {
  logModel.addSmoke(new Date());
  onLogChanged();
}

window.mainController = { initMain };
window.addSmoke = addSmoke;

})();
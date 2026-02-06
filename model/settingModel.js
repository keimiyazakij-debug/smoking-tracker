// ===== データ管理 =====
function loadSettings() {
  return JSON.parse(localStorage.getItem("settings")) || {
    dailyTarget: 10,
    calendarEvaluation: "target" // ← 追加
  };
}

function saveSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}

window.settingModel = {
  loadSettings,
  saveSettings
};

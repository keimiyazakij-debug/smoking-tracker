// ===== データ管理 =====
function loadSettings() {
  return JSON.parse(localStorage.getItem("settings")) || {
    dailyTarget: 10,
    tar: 8.0,
    nicotine: 0.6,
    calendarEvaluation: "target" // ← 追加
  };
}

function saveSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}
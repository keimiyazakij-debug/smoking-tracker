// ===== データ管理 =====
const DEFAULT_SETTINGS = {
  dailyTarget: 10,
  calendarEvaluation: "target"
};

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem("settings") || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  const safeSettings =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...DEFAULT_SETTINGS, ...settings }
      : { ...DEFAULT_SETTINGS };
  localStorage.setItem("settings", JSON.stringify(safeSettings));
}

window.settingModel = {
  loadSettings,
  saveSettings
};

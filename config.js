const holidays = {};
let settingsInputs = [];

// ===== 設定画面 =====
document.addEventListener("DOMContentLoaded", () => {

  const settingsInputs = document.querySelectorAll(".setting-input");

  settingsInputs.forEach(input => {
    input.addEventListener("input", () => {
      const s = loadSettings();
      s[input.id] = Number(input.value);
      saveSettings(s);
      updateMainDisplay();
    });
  });

  loadSettingsToInputs();
});

function loadSettingsToInputs() {
  const s = loadSettings();

  document.querySelectorAll(".setting-input")
    .forEach(input => input.value = s[input.id]);

  // カレンダー評価設定
  document
    .querySelectorAll("input[name='calendarEvaluation']")
    .forEach(r => r.checked = (r.value === s.calendarEvaluation));
}

function saveCurrentSettings() {
  const s = loadSettings();
  settingsInputs.forEach(input => s[input.id] = Number(input.value));
  saveSettings(s);
}

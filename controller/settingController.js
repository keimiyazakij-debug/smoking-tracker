(function () {

const holidays = {};
let settingsInputs = [];

// ===== 設定画面 =====
document.addEventListener("DOMContentLoaded", () => {
  settingsInputs = Array.from(document.querySelectorAll(".setting-input"));

  settingsInputs.forEach(input => {
    input.addEventListener("input", () => {
      const s = window.settingModel.loadSettings();
      s[input.id] = Number(input.value);
      window.settingModel.saveSettings(s);
      // 旧 updateMainDisplay は廃止。現在は onLogChanged で全画面再描画する
      if (typeof window.onLogChanged === "function") {
        window.onLogChanged();
      }
    });
  });

  loadSettingsToInputs();
});

function loadSettingsToInputs() {
  const s = window.settingModel.loadSettings();

  document.querySelectorAll(".setting-input")
    .forEach(input => input.value = s[input.id]);

  // カレンダー評価設定
  document
    .querySelectorAll("input[name='calendarEvaluation']")
    .forEach(r => r.checked = (r.value === s.calendarEvaluation));
}

function saveCurrentSettings() {
  const s = window.settingModel.loadSettings();
  settingsInputs.forEach(input => s[input.id] = Number(input.value));
  window.settingModel.saveSettings(s);
}

// ===== 設定画面でのプランの判定 =====
function isPremium() {
  // 今は固定で false（将来ここを書き換える）
  return false;
}

// ===== 設定画面でのデータ消去処理 =====
function resetAll() {
  if (!confirm("すべての記録と設定が削除されます。よろしいですか？")) return;
  localStorage.clear();
  location.reload();
}

// インラインonclick/他Viewから使うため公開
window.resetAll = resetAll;
window.isPremium = isPremium;

})();

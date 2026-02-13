(function () {

const holidays = {};
let settingsInputs = [];
const DEBUG_SECTION_ID = "settingsDebugSection";
const DEBUG_TOGGLE_ID = "debugPremiumToggle";
const DEV_MODE_FALLBACK =
  (typeof location !== "undefined" && typeof location.hostname === "string" && location.hostname === "localhost") ||
  (typeof location !== "undefined" && typeof location.hostname === "string" && location.hostname.includes("github.io"));

function ensurePremiumApi() {
  // common.js が先に読み込まれる前提だが、テスト環境ではフォールバックを用意
  if (typeof window.getIsPremium !== "function") {
    let localPremiumState = false;
    const saved = localStorage.getItem("debug_isPremium");
    if (saved !== null) localPremiumState = saved === "true";
    window.getIsPremium = () => localPremiumState;
    window.setIsPremium = (value) => {
      localPremiumState = !!value;
      localStorage.setItem("debug_isPremium", String(localPremiumState));
      return localPremiumState;
    };
  }
  if (typeof window.isPremium !== "function") {
    window.isPremium = () => window.getIsPremium();
  }
  if (typeof window.isDevMode !== "boolean") {
    if (typeof globalThis.isDevMode === "boolean") {
      window.isDevMode = globalThis.isDevMode;
    } else {
      window.isDevMode = DEV_MODE_FALLBACK;
    }
  }
}

// ===== 設定画面 =====
document.addEventListener("DOMContentLoaded", () => {
  ensurePremiumApi();
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
  renderPlanInfo();
  if (window.isDevMode) {
    renderDebugSection();
  }
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

function renderPlanInfo() {
  const planInfo = document.getElementById("planInfo");
  if (!planInfo) return;
  if (window.getIsPremium()) {
    planInfo.innerHTML = `
      <strong>プレミアム</strong><br>
      ・記録は無期限<br>
      ・統計情報が表示されます<br>
      ・広告が軽減されます
    `;
  } else {
    planInfo.innerHTML = `
      <strong>無料版</strong><br>
      ・記録は直近60日まで<br>
      ・広告が表示されます
    `;
  }
}

// ===== 開発モード専用: デバッグセクション =====
function renderDebugSection() {
  const settingsRoot = document.getElementById("settings");
  if (!settingsRoot) return;
  if (document.getElementById(DEBUG_SECTION_ID)) {
    const existingToggle = document.getElementById(DEBUG_TOGGLE_ID);
    if (existingToggle) {
      existingToggle.checked = window.getIsPremium();
    }
    return;
  }

  const section = document.createElement("section");
  section.id = DEBUG_SECTION_ID;
  section.className = "settings-card settings-debug-card";
  section.innerHTML = `
    <h3 class="settings-section-title">開発者設定</h3>
    <label class="settings-item settings-item-debug">
      <span class="settings-item-label">プレミアムモード（デバッグ）</span>
      <span class="settings-debug-toggle-wrap">
        <input type="checkbox" id="${DEBUG_TOGGLE_ID}">
        <span class="settings-debug-toggle-ui"></span>
      </span>
    </label>
  `;
  settingsRoot.appendChild(section);

  const toggle = document.getElementById(DEBUG_TOGGLE_ID);
  if (!toggle) return;
  toggle.checked = window.getIsPremium();
  toggle.addEventListener("change", () => {
    window.setIsPremium(toggle.checked);
    renderPlanInfo();
    if (typeof window.onLogChanged === "function") {
      window.onLogChanged();
    }
  });
}

// ===== 設定画面でのデータ消去処理 =====
function resetAll() {
  if (!confirm("すべての記録と設定が削除されます。よろしいですか？")) return;
  localStorage.clear();
  location.reload();
}

// インラインonclick/他Viewから使うため公開
window.resetAll = resetAll;
window.isPremium = () => window.getIsPremium();

})();

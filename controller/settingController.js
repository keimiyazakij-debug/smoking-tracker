(function () {

const holidays = {};
let settingsInputs = [];
const DEBUG_SECTION_ID = "settingsDebugSection";
const DEBUG_TOGGLE_ID = "debugPremiumToggle";
const DEBUG_CACHE_ID = "debugCacheName";
const EXPORT_BUTTON_ID = "exportDataBtn";
const IMPORT_BUTTON_ID = "importDataBtn";
const IMPORT_FILE_INPUT_ID = "importDataFile";
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
  bindDataTransferActions();
  renderPlanInfo();
  if (window.isDevMode) {
    renderDebugSection();
  }
});

function bindDataTransferActions() {
  const exportBtn = document.getElementById(EXPORT_BUTTON_ID);
  if (exportBtn) {
    exportBtn.addEventListener("click", exportData);
  }

  const importBtn = document.getElementById(IMPORT_BUTTON_ID);
  const importFile = document.getElementById(IMPORT_FILE_INPUT_ID);
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const file = importFile.files && importFile.files[0] ? importFile.files[0] : null;
      if (!file) return;
      importData(file);
      importFile.value = "";
    });
  }
}

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
    renderSwCacheName();
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
    <p id="${DEBUG_CACHE_ID}" class="settings-item-help settings-debug-cache">SW CACHE: 読み込み中...</p>
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

  renderSwCacheName();
}

async function renderSwCacheName() {
  const cacheText = document.getElementById(DEBUG_CACHE_ID);
  if (!cacheText) return;
  const cacheName = await getSwCacheName();
  cacheText.textContent = `SW CACHE: ${cacheName}`;
}

async function getSwCacheName() {
  const swPath = typeof window.APP_SW_FILE === "string" ? window.APP_SW_FILE : "./service-worker.prod.js";
  try {
    const response = await fetch(swPath, { cache: "no-store" });
    if (!response.ok) return "取得失敗";
    const source = await response.text();
    const match = source.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/);
    return match ? match[1] : "未定義";
  } catch (_) {
    return "取得失敗";
  }
}

// ===== 設定画面でのデータ消去処理 =====
function resetAll() {
  if (!confirm("すべての記録と設定が削除されます。よろしいですか？")) return;
  localStorage.clear();
  location.reload();
}

function exportData() {
  try {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      data[key] = localStorage.getItem(key);
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `smoking-tracker-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    alert("エクスポートに失敗しました。");
  }
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function onLoad(event) {
    try {
      const raw = event?.target?.result;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("invalid format");
      }

      if (!confirm("現在のデータを上書きします。よろしいですか？")) {
        return;
      }

      localStorage.clear();
      Object.keys(parsed).forEach((key) => {
        localStorage.setItem(key, String(parsed[key]));
      });

      alert("インポートが完了しました。再読み込みします。");
      location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      alert("ファイル形式が正しくありません。");
    }
  };
  reader.onerror = function onError() {
    alert("ファイルの読み込みに失敗しました。");
  };
  reader.readAsText(file, "utf-8");
}

// インラインonclick/他Viewから使うため公開
window.resetAll = resetAll;
window.exportData = exportData;
window.importData = importData;
window.isPremium = () => window.getIsPremium();

})();

// ===== バッジ =====　（とりあえず配列）
const badgeMaster = [
  { key: "5min", label: "🌱 5分達成", condition: 5 },
  { key: "30min", label: "⏳ 30分達成", condition: 30 },
  { key: "1hour", label: "🏅 1時間達成", condition: 60 }
];

// ===== カレンダー用の変数宣言 =====
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

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

// 今日の喫煙データ
function loadLogs() {
  return JSON.parse(localStorage.getItem("dailyLogs") || "{}");
}

function saveLogs(logs) {
  localStorage.setItem("dailyLogs", JSON.stringify(logs));
}

// バッジ
function loadBadges() {
  return JSON.parse(localStorage.getItem("badges") || "[]");
}

function saveBadges(badges) {
  localStorage.setItem("badges", JSON.stringify(badges));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayKey() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000; // 分→ミリ秒
  const localISO = new Date(now - tzOffset).toISOString().slice(0,10);
  return localISO;
}

/*
// ------------------------------------------------
// ===== 開発用ダミーデータ =====
function seedDummyLogs() {

  // すでにログがある場合は何もしない（安全）
  if (localStorage.getItem("dailyLogs")) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0始まり
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const logs = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // 未来日は作らない
    if (new Date(dateKey) > today) continue;

    // ランダムでパターン分け
    const r = Math.random();

    if (r < 0.3) {
      // データなし（未入力）
      continue;
    }
    else if (r < 0.5) {
      // 禁煙成功（0本）
      logs[dateKey] = [];
    }
    else {
      // 喫煙あり（1〜5本）
      const count = Math.floor(Math.random() * 5) + 1;
      logs[dateKey] = [];

      for (let i = 0; i < count; i++) {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        const time = new Date(year, month, d, h, m).toISOString();
        logs[dateKey].push(time);
      }
    }
  }

  localStorage.setItem("dailyLogs", JSON.stringify(logs));
  console.log("ダミーデータを投入しました");
}
// ------------------------------------------------ */



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

// 更新系のとりまとめ
function afterLogChanged() {
  updateBadges();
  updateMainDisplay();
  renderCalendar();
}

// 日付取得用の関数
function getDateKey(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0,10);
}

// 今日の喫煙データ
function loadLogs() {
  return JSON.parse(localStorage.getItem("dailyLogs") || "{}");
}

function saveLogs(logs) {
  localStorage.setItem("dailyLogs", JSON.stringify(logs));
}

// 最新の喫煙データを取得
function getLastSmokeTime(logs) {
  let last = null;

  Object.values(logs).forEach(times => {
    times.forEach(t => {
      const d = new Date(t);
      if (!last || d > last) last = d;
    });
  });

  return last; // Date or null
}

// メイン画面用の時間表示フォーマット
function formatDurationFromMinutes(totalMin) {
  if (totalMin < 60) {
    return `${totalMin}分`;
  }

  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;

  if (hours < 24) {
    return `${hours}時間${minutes}分`;
  }

  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;

  return `${days}日${remainHours}時間`;
}


// バッジ
function loadBadges() {
  return JSON.parse(localStorage.getItem("badges") || "[]");
}

function saveBadges(badges) {
  localStorage.setItem("badges", JSON.stringify(badges));
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

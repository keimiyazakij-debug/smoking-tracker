// グローバル変数の宣言
// ===== カレンダー用の変数宣言 =====
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();


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
  try {
    return JSON.parse(localStorage.getItem("dailyLogs") || "{}");
  } catch {
    return {};
  }
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
  try {
    return JSON.parse(localStorage.getItem("badges") || "[]");
  } catch {
    return [];
  }
}
function saveBadges(badges) {
  localStorage.setItem("badges", JSON.stringify(badges));
}


function formatDate(date = new Date()) {
  return getDateKey(date);
}

function buildContext(now = new Date()) {
  const logs = loadLogs();
  const todayKey = getDateKey(now);
  const todayLogs = logs[todayKey] || [];

  const lastSmokeAt = getLastSmokeTime(logs);
  const minutesFromLastSmoke =
    lastSmokeAt ? Math.floor((now - lastSmokeAt) / 60000) : null;

  const yesterdayKey = getDateKey(new Date(now.getTime() - 86400000));
  const yesterdayCount = logs[yesterdayKey]?.length ?? null;

  return {
    now,
    todayKey,
    todayCount: todayLogs.length,
    yesterdayCount,
    lastSmokeAt,
    minutesFromLastSmoke,
    consecutiveNoSmokeDays: calculateNoSmokeDays(logs),
    openedToday: true,
    hasRecordToday: todayKey in logs,
    badgesEarnedToday: [] // badgeController 側で注入
  };
}

function calculateNoSmokeDays(logs) {
  // 喫煙記録がない場合は 0 日
  if (!logs || Object.keys(logs).length === 0) return 0;

  // 日付キーを降順に並べる
  const dates = Object.keys(logs).sort().reverse();

  let count = 0;
  for (const date of dates) {
    // その日に1本でも吸っていれば終了
    if (logs[date] && logs[date].length > 0) break;
    count++;
  }

  return count;
}



window.common = window.common || {};

// ===== カレンダー用の変数宣言 =====
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

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


function formatDate(date = new Date()) {
  return getDateKey(date);
}

// common.js
function buildContext({
  now = new Date(),
  logs = {},
  settings,
  badgesEarnedToday = [],
  dateKey
}) {
  const todayKey = dateKey ?? getDateKey(now);
  const realTodayKey = getDateKey(new Date());
  const todayLogs = logs[todayKey] || [];
  const yesterdayKey = getDateKey(
    new Date(now.getTime() - 24 * 60 * 60 * 1000)
  );
  const yesterdayLogs = logs[yesterdayKey];

  const lastSmokeAt = getLastSmokeTime(logs);
  const minutesFromLastSmoke = lastSmokeAt
    ? Math.floor((now - lastSmokeAt) / 60000)
    : null;

  const stats = calculateStats(groupLogsByDate(logs), settings);

  // 時間帯ごとの喫煙本数カウント
  function countBetween(from, to) {
    return todayLogs.filter(t => {
      const h = new Date(t).getHours();
      return h >= from && h < to;
    }).length;
  }
    
  return {
    now,
    todayKey,
    todayCount: todayLogs.length,
    yesterdayCount: yesterdayLogs ? yesterdayLogs.length : null,
    lastSmokeAt,
    minutesFromLastSmoke,
    openedToday: true,
    hasRecordToday: todayLogs.length > 0,
    badgesEarnedToday,
    stats,
    settings,
    isToday: todayKey === realTodayKey,
    nowHour: now.getHours() ,
    countBetween
   };
}

function calculateStats(days, setting) {
  const goalPerDay = setting.goalPerDay;
  const todayKey = getDateKey(new Date());

  let dailyTotal = 0;
  let goalTotal  = 0;
  let downTotal  = 0;

  let dailyCur = 0, dailyMax = 0;
  let goalCur  = 0, goalMax  = 0;
  let downCur  = 0, downMax  = 0;

  let prevSmoke = null;

  for (const d of days) {
    const isToday = d.date === todayKey;

    // ===== daily =====
    if (d.logged) {
      dailyTotal++;
      dailyCur++;
      dailyMax = Math.max(dailyMax, dailyCur);
    } else if (!isToday) {
      dailyCur = 0;
    }

    // ===== goal =====
    if (!isToday && d.smoke <= goalPerDay) {
      goalTotal++;
      goalCur++;
      goalMax = Math.max(goalMax, goalCur);
    } else if (!isToday) {
      goalCur = 0;
    }

    // ===== down =====
    if (!isToday && prevSmoke !== null && d.smoke < prevSmoke) {
      downTotal++;
      downCur++;
      downMax = Math.max(downMax, downCur);
    } else if(!isToday){
      downCur = 0;
    }

    prevSmoke = d.smoke;
  }

  return {
    dailyTotal,
    dailyStreak: dailyCur,
    dailyStreakMax: dailyMax,
    goalTotal,
    goalStreak: goalCur,
    goalStreakMax: goalMax,
    downTotal,
    downStreak: downCur,
    downStreakMax: downMax
  };
}

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ===== private helper =====
function isNextDay(dateKey, nextKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const y2 = dt.getFullYear();
  const m2 = String(dt.getMonth() + 1).padStart(2, '0');
  const d2 = String(dt.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}` === nextKey;
}

function groupLogsByDate(logs) {
  const dates = Object.keys(logs);
  if (dates.length === 0) return [];

  const start = new Date(dates.sort()[0]);
  const end = new Date(); // 今日


  const result = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = getDateKey(d);
    const times = logs[key] || [];

    result.push({
      date: key,
      smoke: times.length,
      logged: times.length > 0
    });
  }  return result;
}

// 日付・表示系
window.common.getDateKey = getDateKey;
window.common.formatDate = formatDate;
window.common.formatDurationFromMinutes = formatDurationFromMinutes;
window.common.parseDateKey = parseDateKey;

// ログ関連
window.common.loadLogs = loadLogs;
window.common.saveLogs = saveLogs;
window.common.getLastSmokeTime = getLastSmokeTime;

// 集計・文脈
window.common.groupLogsByDate = groupLogsByDate;
window.common.calculateStats = calculateStats;
window.common.buildContext = buildContext;

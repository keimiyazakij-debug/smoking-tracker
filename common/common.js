window.common = window.common || {};

// 日付取得用の関数
function getDateKey(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0,10);
}

// 無料版ロック設定: 直近60日まで閲覧可能
const FREE_LIMIT_DAYS = 60;
const DEBUG_PREMIUM_KEY = "debug_isPremium";
// デバッグ専用プレミアム状態を一元管理
let premiumState = false;
const isDevMode =
  (typeof location !== "undefined" && location.hostname === "127.0.0.1") ||
  (typeof location !== "undefined" && location.hostname === "localhost") ||
  (typeof location !== "undefined" && location.hostname.includes("github.io"));

try {
  const saved = localStorage.getItem(DEBUG_PREMIUM_KEY);
  if (saved !== null) {
    premiumState = saved === "true";
  }
} catch {
  premiumState = false;
}

function getIsPremium() {
  // デバッグ切替は開発モードでのみ有効
  if (!isDevMode) return false;
  return premiumState;
}

function setIsPremium(value) {
  premiumState = !!value;
  try {
    localStorage.setItem(DEBUG_PREMIUM_KEY, String(premiumState));
  } catch {
    // noop
  }
  return premiumState;
}

function differenceInDays(fromDate, toDate) {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.floor((from - to) / (24 * 60 * 60 * 1000));
}

// 閲覧ロック判定はこの関数に集約する
function isDateLocked(dateInput) {
  if (getIsPremium()) return false;
  if (!dateInput) return false;

  const todayDate = parseDateKey(getDateKey(new Date()));
  const targetDate =
    typeof dateInput === "string"
      ? parseDateKey(dateInput)
      : new Date(dateInput);
  if (Number.isNaN(targetDate.getTime())) return false;

  const diffDays = differenceInDays(todayDate, targetDate);
  return diffDays > FREE_LIMIT_DAYS;
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
  const consecutiveNoSmokeDays = getConsecutiveNoSmokeDays(logs, todayKey);

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
    countBetween,
    consecutiveNoSmokeDays
   };
}

function calculateStats(days, setting) {
  const goalPerDay = setting?.dailyTarget ?? 0;
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

/**
 * 日付の状態を返す
 * - key未存在: 未記録
 * - key存在 & length===0: 禁煙成功
 * - key存在 & length>0: 喫煙日
 */
function getDayStatus(date, dailyLogs = {}) {
  const logs = dailyLogs?.[date];
  if (logs === undefined) return "unrecorded";
  if (Array.isArray(logs) && logs.length > 0) return "smoke";
  return "success";
}

function groupLogsByDate(logs) {
  const dates = Object.keys(logs || {}).sort();
  if (dates.length === 0) return [];

  return dates.map((key) => {
    const times = Array.isArray(logs[key]) ? logs[key] : [];
    const status = getDayStatus(key, logs);
    return {
      date: key,
      smoke: times.length,
      logged: status !== "unrecorded"
    };
  });
}

function getConsecutiveNoSmokeDays(logs, todayKey) {
  const keys = Object.keys(logs || {});
  if (keys.length === 0) return 0;

  const earliestKey = keys.sort()[0];
  const earliestDate = parseDateKey(earliestKey);
  let d = parseDateKey(todayKey);
  let count = 0;

  while (d >= earliestDate) {
    const key = getDateKey(d);
    const status = getDayStatus(key, logs);
    if (status === "unrecorded" || status === "smoke") break;
    count++;
    d.setDate(d.getDate() - 1);
  }

  return count;
}

// 日付・表示系
window.common.getDateKey = getDateKey;
window.common.formatDate = formatDate;
window.common.formatDurationFromMinutes = formatDurationFromMinutes;
window.common.parseDateKey = parseDateKey;
window.common.getDayStatus = getDayStatus;
window.common.differenceInDays = differenceInDays;
window.common.isDateLocked = isDateLocked;
window.common.FREE_LIMIT_DAYS = FREE_LIMIT_DAYS;
window.common.isDevMode = isDevMode;
window.getIsPremium = getIsPremium;
window.setIsPremium = setIsPremium;
// 既存互換: 参照先は getIsPremium に集約
window.isPremium = () => getIsPremium();
window.isDevMode = isDevMode;

// ログ関連
window.common.getLastSmokeTime = getLastSmokeTime;

// 集計・文脈
window.common.groupLogsByDate = groupLogsByDate;
window.common.calculateStats = calculateStats;
window.common.buildContext = buildContext;

window.appState = {
  todayKey: null
};

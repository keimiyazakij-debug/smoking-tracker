// cheerEngine.js
// 応援メッセージ判定ロジック（UI非依存）

// ===== 応援メッセージ定義 =====
const cheerMessages = [
  // ---- time ----
  { key: "time_5m", type: "time", condition: { minutes: 5 }, priority: 100, oncePerDay: true,
    text: "もう5分経ちました。最初の山は越えています。" },
  { key: "time_10m", type: "time", condition: { minutes: 10 }, priority: 95, oncePerDay: true,
    text: "10分耐えました。衝動は少しずつ下がります。" },
  { key: "time_30m", type: "time", condition: { minutes: 30 }, priority: 90, oncePerDay: true,
    text: "30分、ここまで来ました。今は一番きつい時間帯かもしれません。" },
  { key: "time_1h", type: "time", condition: { minutes: 60 }, priority: 85, oncePerDay: true,
    text: "1時間耐えました。身体は楽になる方向に向かっています。" },

  // ---- count ----
  { key: "count_zero", type: "count", condition: { zero: true }, priority: 75, oncePerDay: true,
    text: "今日は0本です。立派な成功です。" },
  { key: "count_decrease", type: "count", condition: { diff: -1 }, priority: 70, oncePerDay: true,
    text: "昨日より少ない本数です。方向は合っています。" },

  // ---- days ----
  { key: "day_1", type: "days", condition: { days: 1 }, priority: 60, oncePerDay: true,
    text: "昨日は0本で終えました。良いスタートです。" },
  { key: "day_3", type: "days", condition: { days: 3 }, priority: 55, oncePerDay: true,
    text: "3日続きました。もう偶然ではありません。" },

  // ---- badge ----
  { key: "badge_any", type: "badge", condition: { any: true }, priority: 80, oncePerDay: false,
    text: "🏅 新しいバッジを獲得しました。" }
];

// ===== メイン関数 =====
function checkCheerMessage(ctx) {
  const today = formatDate(ctx.now);

  const candidates = cheerMessages
    .filter(m => checkCondition(m, ctx))
    .filter(m => !m.oncePerDay || ctx.cheerHistory[m.key] !== today)
    .sort((a, b) => b.priority - a.priority);

  return candidates[0] || null;
}

// ===== 条件分岐 =====
function checkCondition(msg, ctx) {
  switch (msg.type) {
    case "time": return checkTime(msg.condition, ctx);
    case "count": return checkCount(msg.condition, ctx);
    case "days": return checkDays(msg.condition, ctx);
    case "badge": return checkBadge(msg.condition, ctx);
    default: return false;
  }
}

// ===== 各条件判定 =====
function checkTime(cond, ctx) {
  if (!ctx.lastSmokeAt) return false;
  const minutes = (ctx.now - ctx.lastSmokeAt) / 60000;
  return minutes >= cond.minutes;
}

function checkCount(cond, ctx) {
  if (cond.zero) return ctx.todayCount === 0;
  if (cond.diff !== undefined) {
    return (ctx.todayCount - ctx.yesterdayCount) <= cond.diff;
  }
  return false;
}

function checkDays(cond, ctx) {
  return ctx.consecutiveDays >= cond.days;
}

function checkBadge(cond, ctx) {
  if (cond.any) return ctx.badgesEarnedToday.length > 0;
  return false;
}


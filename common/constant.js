// バッジの設定
const BADGES = [
  {
    id: "time_5m",
    label: "🌱 5分達成",
    check: ctx => ctx.minutesFromLastSmoke >= 5
  },
  {
    id: "time_30m",
    label: "⏳ 30分達成",
    check: ctx => ctx.minutesFromLastSmoke >= 30
  },
  {
    id: "time_1h",
    label: "🏅 1時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 60
  },
  {
    id: "day_1",
    label: "📅 禁煙1日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 1
  },
  {
    id: "day_3",
    label: "📅 禁煙3日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 3
  }
];


const DAILY_TASKS = [

  /* =========================
   * 記録・参加系（最軽量）
   * ========================= */

  {
    id: "opened_app_today",
    label: "アプリを開いた",
    category: "participation",
    check: (ctx) => ctx.openedToday === true
  },

  {
    id: "recorded_today",
    label: "今日の記録をつけた",
    category: "record",
    check: (ctx) => ctx.hasRecordToday === true
  },

  /* =========================
   * 禁煙・本数系（主軸）
   * ========================= */

  {
    id: "no_smoke_today",
    label: "今日は1本も吸っていない",
    category: "count",
    check: (ctx) => ctx.isNoSmokeToday === true
  },

  {
    id: "within_target",
    label: "目標本数以内に収まった",
    category: "count",
    check: (ctx) =>
      typeof ctx.todayCount === "number" &&
      typeof ctx.targetCount === "number" &&
      ctx.todayCount <= ctx.targetCount
  },

  {
    id: "less_than_yesterday",
    label: "昨日より本数を減らせた",
    category: "count",
    check: (ctx) =>
      typeof ctx.todayCount === "number" &&
      typeof ctx.yesterdayCount === "number" &&
      ctx.todayCount < ctx.yesterdayCount
  },

  /* =========================
   * 行動改善・プロセス系
   * ========================= */

  {
    id: "long_interval_60",
    label: "1時間以上我慢できた",
    category: "process",
    check: (ctx) =>
      typeof ctx.longestIntervalToday === "number" &&
      ctx.longestIntervalToday >= 60
  },

  {
    id: "long_interval_120",
    label: "2時間以上我慢できた",
    category: "process",
    check: (ctx) =>
      typeof ctx.longestIntervalToday === "number" &&
      ctx.longestIntervalToday >= 120
  },

  /* =========================
   * 姿勢・振り返り系（軽い肯定）
   * ========================= */

  {
    id: "checked_today",
    label: "今日の状況を確認した",
    category: "reflection",
    check: (ctx) => ctx.openedToday === true
  }

];
// バッジの設定
const BADGES = [
  /* =========================
  * ① 禁煙時間・継続系
  * ========================= */
  {
    id: "time_3h",
    category: "time",
    label: "⏱ 3時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 180
  },
  {
    id: "time_6h",
    category: "time",
    label: "⏱ 6時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 360
  },
  {
    id: "time_12h",
    category: "time",
    label: "⏱ 12時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 720
  },
  {
    id: "time_18h",
    category: "time",
    label: "⏱ 18時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 1080
  },
  {
    id: "time_24h",
    category: "time",
    label: "⏱ 24時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 1440
  },
  {
    id: "nosmoke_2d",
    category: "nosmoke",
    label: "📅 禁煙2日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 2
  },
  {
    id: "nosmoke_3d",
    category: "nosmoke",
    label: "📅 禁煙3日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 3
  },
  {
    id: "nosmoke_5d",
    category: "nosmoke",
    label: "📅 禁煙5日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 5
  },
  {
    id: "nosmoke_7d",
    category: "nosmoke",
    label: "📅 禁煙7日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 7
  },
  {
    id: "nosmoke_14d",
    category: "nosmoke",
    label: "📅 禁煙14日達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 14
  },

  /* =========================
  * ② デイリーチャレンジ
  * ========================= */

  // 連続
  {
    id: "daily_streak_2",
    category: "daily_streak",
    label: "🔥 チャレンジ2日連続",
    check: ctx => ctx.dailyStreak >= 2
  },
  {
    id: "daily_streak_3",
    category: "daily_streak",
    label: "🔥 チャレンジ3日連続",
    check: ctx => ctx.dailyStreak >= 3
  },
  {
    id: "daily_streak_5",
    category: "daily_streak",
    label: "🔥 チャレンジ5日連続",
    check: ctx => ctx.dailyStreak >= 5
  },
  {
    id: "daily_streak_7",
    category: "daily_streak",
    label: "🔥 チャレンジ7日連続",
    check: ctx => ctx.dailyStreak >= 7
  },

  // 累計
  {
    id: "daily_total_1",
    category: "daily_hist",
    label: "📦 チャレンジ累計1回",
    check: ctx => ctx.dailyTotal >= 1
  },
  {
    id: "daily_total_2",
    category: "daily_hist",
    label: "📦 チャレンジ累計1回",
    check: ctx => ctx.dailyTotal >= 1
  },
  {
    id: "daily_total_3",
    category: "daily_hist",
    label: "📦 チャレンジ累計3回",
    check: ctx => ctx.dailyTotal >= 1
  },
  {
    id: "daily_total_5",
    category: "daily_hist",
    label: "📦 チャレンジ累計5回",
    check: ctx => ctx.dailyTotal >= 5
  },
  {
    id: "daily_total_10",
    category: "daily_hist",
    label: "📦 チャレンジ累計10回",
    check: ctx => ctx.dailyTotal >= 10
  },
  {
    id: "daily_total_15",
    category: "daily_hist",
    label: "📦 チャレンジ累計15回",
    check: ctx => ctx.dailyTotal >= 15
  },
  {
    id: "daily_total_20",
    category: "daily_hist",
    label: "📦 チャレンジ累計20回",
    check: ctx => ctx.dailyTotal >= 20
  },

  /* =========================
  * ③ 本数コントロール
  * ========================= */

  /* --- 目標本数：連続 --- */
  {
    id: "goal_streak_2",
    category: "goal_streak",
    label: "🎯 目標本数2日連続達成",
    check: ctx => ctx.goalStreak >= 2
  },
  {
    id: "goal_streak_3",
    category: "goal_streak",
    label: "🎯 目標本数3日連続達成",
    check: ctx => ctx.goalStreak >= 3
  },
  {
    id: "goal_streak_5",
    category: "goal_streak",
    label: "🎯 目標本数5日連続達成",
    check: ctx => ctx.goalStreak >= 5
  },
  {
    id: "goal_streak_7",
    category: "goal_streak",
    label: "🎯 目標本数7日連続達成",
    check: ctx => ctx.goalStreak >= 7
  },

  /* --- 目標本数：累計 --- */
  {
    id: "goal_total_1",
    category: "goal_total",
    label: "📊 目標本数 累計1日",
    check: ctx => ctx.goalTotal >= 1
  },
  {
    id: "goal_total_2",
    category: "goal_total",
    label: "📊 目標本数 累計2日",
    check: ctx => ctx.goalTotal >= 2
  },
  {
    id: "goal_total_3",
    category: "goal_total",
    label: "📊 目標本数 累計3日",
    check: ctx => ctx.goalTotal >= 3
  },
  {
    id: "goal_total_5",
    category: "goal_total",
    label: "📊 目標本数 累計5日",
    check: ctx => ctx.goalTotal >= 5
  },
  {
    id: "goal_total_10",
    category: "goal_total",
    label: "📊 目標本数 累計10日",
    check: ctx => ctx.goalTotal >= 10
  },
  {
    id: "goal_total_15",
    category: "goal_total",
    label: "📊 目標本数 累計15日",
    check: ctx => ctx.goalTotal >= 15
  },
  {
    id: "goal_total_20",
    category: "goal_total",
    label: "📊 目標本数 累計20日",
    check: ctx => ctx.goalTotal >= 20
  },

  /* --- 前日比マイナス：連続 --- */
  {
    id: "down_streak_2",
    category: "down_streak",
    label: "📉 前日比減少2日連続",
    check: ctx => ctx.downStreak >= 2
  },
  {
    id: "down_streak_3",
    category: "down_streak",
    label: "📉 前日比減少3日連続",
    check: ctx => ctx.downStreak >= 3
  },
  {
    id: "down_streak_5",
    category: "down_streak",
    label: "📉 前日比減少5日連続",
    check: ctx => ctx.downStreak >= 5
  },
  {
    id: "down_streak_7",
    category: "down_streak",
    label: "📉 前日比減少7日連続",
    check: ctx => ctx.downStreak >= 7
  },

  /* --- 前日比マイナス：累計 --- */
  {
    id: "down_total_1",
    category: "down_total",
    label: "⬇ 前日比減少 累計1日",
    check: ctx => ctx.downTotal >= 1
  },
  {
    id: "down_total_2",
    category: "down_total",
    label: "⬇ 前日比減少 累計2日",
    check: ctx => ctx.downTotal >= 2
  },
  {
    id: "down_total_3",
    category: "down_total",
    label: "⬇ 前日比減少 累計3日",
    check: ctx => ctx.downTotal >= 3
  },
  {
    id: "down_total_5",
    category: "down_total",
    label: "⬇ 前日比減少 累計5日",
    check: ctx => ctx.downTotal >= 5
  },
  {
    id: "down_total_7",
    category: "down_total",
    label: "⬇ 前日比減少 累計7日",
    check: ctx => ctx.downTotal >= 7
  },
  {
    id: "down_total_10",
    category: "down_total",
    label: "⬇ 前日比減少 累計10日",
    check: ctx => ctx.downTotal >= 10
  },
  {
    id: "down_total_15",
    category: "down_total",
    label: "⬇ 前日比減少 累計15日",
    check: ctx => ctx.downTotal >= 15
  },
  {
    id: "down_total_20",
    category: "down_total",
    label: "⬇ 前日比減少 累計20日",
    check: ctx => ctx.downTotal >= 20
  }
];

// 日々のチャレンジの設定
const DAILY_TASKS = [

  /* =========================
   * 行動の起点
   * ========================= */

  {
    id: "recorded_today",
    label: "今日の喫煙回数を更新した",
    category: "record",
    check: (ctx) => ctx.hasRecordToday === true
  },

  /* =========================
   * 時間間隔（我慢）
   * ========================= */

  {
    id: "long_interval_3h",
    label: "3時間以上、間隔を空けられた",
    category: "process",
    check: (ctx) =>
      typeof ctx.longestIntervalToday === "number" &&
      ctx.longestIntervalToday >= 180
  },

  {
    id: "long_interval_5h",
    label: "5時間以上、間隔を空けられた",
    category: "process",
    check: (ctx) =>
      typeof ctx.longestIntervalToday === "number" &&
      ctx.longestIntervalToday >= 300
  },

  /* =========================
   * 起床後・時間帯ピーク
   * ========================= */

  {
    id: "first_smoke_after_9",
    label: "9:00まで吸わなかった（起床後）",
    category: "timeband",
    check: (ctx) =>
      typeof ctx.firstSmokeHour === "number" &&
      ctx.firstSmokeHour >= 9
  },

  {
    id: "no_smoke_lunch",
    label: "12:00〜14:00に吸わなかった（昼食後）",
    category: "timeband",
    check: (ctx) =>
      ctx.countBetween &&
      ctx.countBetween(12, 14) === 0
  },

  {
    id: "no_smoke_afternoon",
    label: "15:00〜17:00に吸わなかった（午後）",
    category: "timeband",
    check: (ctx) =>
      ctx.countBetween &&
      ctx.countBetween(15, 17) === 0
  },

  {
    id: "no_smoke_evening",
    label: "18:00〜20:00に吸わなかった（夕方〜夜前）",
    category: "timeband",
    check: (ctx) =>
      ctx.countBetween &&
      ctx.countBetween(18, 20) === 0
  },

  {
    id: "no_smoke_night",
    label: "21:00以降に吸わなかった（寝る前）",
    category: "timeband",
    check: (ctx) =>
      ctx.countBetween &&
      ctx.countBetween(21, 24) === 0
  }

];

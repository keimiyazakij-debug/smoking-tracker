// バッジの設定
window.BADGES = [
  {
    id: "time_24h",
    category: "time",
    label: "24時間達成",
    check: ctx => ctx.minutesFromLastSmoke >= 1440
  },
  {
    id: "nosmoke_7d",
    category: "nosmoke",
    label: "7日連続達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 7
  },
  {
    id: "nosmoke_30d",
    category: "nosmoke",
    label: "30日連続達成",
    check: ctx => ctx.consecutiveNoSmokeDays >= 30
  },
  {
    id: "goal_streak_3",
    category: "goal_streak",
    label: "3日連続目標達成",
    check: ctx => ctx.goalStreak >= 3
  },
  {
    id: "goal_streak_7",
    category: "goal_streak",
    label: "7日連続目標達成",
    check: ctx => ctx.goalStreak >= 7
  },
  {
    id: "down_streak_3",
    category: "down_streak",
    label: "3日連続改善",
    check: ctx => ctx.downStreak >= 3
  },
  {
    id: "down_streak_7",
    category: "down_streak",
    label: "7日連続改善",
    check: ctx => ctx.downStreak >= 7
  },
  {
    id: "no_smoke_morning",
    category: "timeband",
    label: "午前禁煙達成",
    check: ctx => ctx.countBetween(0, 12) === 0
  },
  {
    id: "no_smoke_day",
    category: "nosmoke_day",
    label: "1日完全禁煙",
    check: ctx => ctx.todayCount === 0
  }
];

// 日々のチャレンジの設定
window.DAILY_TASKS = [
  // デイリータスク再設計: 時間帯ベースの5件に統一
  {
    id: "deep_night_reduce",
    label: "深夜の1本を控えてみる。",
    category: "timeband",
    rule: "timeband",
    from: 0,
    to: 6
  },
  {
    id: "morning_reduce",
    label: "朝の1本を減らしてみる。",
    category: "timeband",
    rule: "timeband",
    from: 6,
    to: 9
  },
  {
    id: "late_morning_reduce",
    label: "午前を少し軽くしてみる。",
    category: "timeband",
    rule: "timeband",
    from: 9,
    to: 12
  },
  {
    id: "afternoon_reduce",
    label: "午後の1本を減らしてみる。",
    category: "timeband",
    rule: "timeband",
    from: 12,
    to: 18
  },
  {
    id: "night_reduce",
    label: "夜の1本を減らしてみる。",
    category: "timeband",
    rule: "timeband",
    from: 18,
    to: 24
  }
];

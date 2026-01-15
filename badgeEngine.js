// ===== バッジ =====　（とりあえず配列）
const badgeMaster = [
  // ===== 時間軸 =====
  { key: "time_5m", axis: "time", threshold: 5, unit: "min", label: "🌱 5分達成" },
  { key: "time_30m", axis: "time", threshold: 30, unit: "min", label: "⏳ 30分達成" },
  { key: "time_1h", axis: "time", threshold: 60, unit: "min", label: "🏅 1時間達成" },

  // ===== 日数軸 =====
  { key: "day_1", axis: "day", threshold: 1, label: "📅 禁煙1日達成" },
  { key: "day_3", axis: "day", threshold: 3, label: "📅 禁煙3日達成" },

  // 追加はここに足すだけ
];

// バッジ評価のメイン処理 
function evaluateBadges(logs) {
  const earned = new Set(loadBadges());

  badgeMaster.forEach(badge => {
    if (earned.has(badge.key)) return;

    const ok = evaluateByAxis(badge, logs);
    if (ok) earned.add(badge.key);
  });

  return Array.from(earned);
}

// 評価軸ごとのバッジ評価処理の呼び出し
function evaluateByAxis(badge, logs) {
  switch (badge.axis) {
    case "time":
      return evaluateTimeAxis(badge, logs);
    case "day":
      return evaluateDayAxis(badge, logs);
    case "count":
      return evaluateCountAxis(badge, logs);
    case "achievement":
      return evaluateAchievementAxis(badge, logs);
    default:
      return false;
  }
}

// 時間軸のバッジ評価処理
function evaluateTimeAxis(badge, logs) {
  const last = getLastSmokeTime(logs);
  if (!last) return false;

  const diffMin = Math.floor(
    (Date.now() - last.getTime()) / (1000 * 60)
  );

  return diffMin >= badge.threshold;
}

// 日数軸のバッジ評価処理
function evaluateDayAxis(badge, logs) {
  const days = calculateNoSmokeDays(logs);
  return days >= badge.threshold;
}

// 喫煙していない日数の取得
function calculateNoSmokeDays(logs) {
  const last = getLastSmokeTime(logs);
  if (!last) return 0;

  const diffDays = Math.floor(
    (new Date() - last) / (1000 * 60 * 60 * 24)
  );
  return diffDays;
}

function evaluateCountAxis() {
  return false;
}

function evaluateAchievementAxis() {
  return false;
}

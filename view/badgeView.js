(function () {
// view/badgeView.js

function render() {
  const container = document.getElementById("allBadges");
  if (!container) return;

  container.innerHTML = "";

  const earnedMap = badgeModel.loadEarnedBadges();

  // カテゴリ定義（表示順も兼ねる）
  const CATEGORY_LABELS = {
    time: "禁煙時間・継続",
    nosmoke: "禁煙日数",
    daily_streak: "デイリーチャレンジ連続達成",
    daily_total: "デイリーチャレンジ達成日数",
    goal_streak: "本数コントロール連続達成",
    goal_total: "本数コントロール達成日数",
    down_streak: "前日比減少連続日数",
    down_total: "前日比減少達成日数",
    recovery: "リカバリー"
  };

  // BADGES を category ごとにまとめる
  const grouped = {};
  BADGES.forEach(b => {
    if (!grouped[b.category]) grouped[b.category] = [];
    grouped[b.category].push(b);
  });

  // カテゴリ順に描画
  Object.keys(CATEGORY_LABELS).forEach(cat => {
    const badges = grouped[cat];
    if (!badges || badges.length === 0) return;

    const section = document.createElement("section");
    section.className = "badge-category";

    const h = document.createElement("h3");
    h.textContent = CATEGORY_LABELS[cat];
    section.appendChild(h);

    const list = document.createElement("div");
    list.className = "badge-list";

    badges.forEach(badge => {
      const earned = earnedMap[badge.id];
      const div = document.createElement("div");

      const isEarned = !!earned;
      div.className = "badge" + (isEarned ? " earned" : " locked");
      div.classList.add(badge.category);

      const title = document.createElement("div");
      title.className = "badge-title";
      title.textContent = badge.label + (isEarned ? "" : " 🔒");
      div.appendChild(title);

      // 取得日表示（取得済のみ）
      if (isEarned) {
        const date = document.createElement("div");
        date.className = "badge-date";

        // 旧データ互換（true の場合）
        date.textContent =
          typeof earned === "object" && earned.earnedAt
            ? `取得日：${earned.earnedAt}`
            : "取得日：不明";

        div.appendChild(date);
      }

      list.appendChild(div);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

window.badgeView = { render };

})();

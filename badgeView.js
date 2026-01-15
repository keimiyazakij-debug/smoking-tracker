// バッジ管理画面の表示
function renderBadges() {

  const badges = loadBadges();

  // ===== 取得済み =====
  const earned = document.getElementById("earnedBadges");
  if (earned) {
    earned.innerHTML = "";
    badges.forEach(key => {
      const master = badgeMaster.find(b => b.key === key);
      if (!master) return;

      const div = document.createElement("div");
      div.className = "badge earned";
      div.textContent = master.label + " ✔";
      earned.appendChild(div);
    });
  }

  // ===== 一覧 =====
  const all = document.getElementById("allBadges");
  if (all) {
    all.innerHTML = "";
    badgeMaster.forEach(b => {
      const has = badges.includes(b.key);

      const div = document.createElement("div");
      div.className = "badge" + (has ? " earned" : " locked");
      div.textContent = b.label + (has ? " ✔" : " 🔒");
      all.appendChild(div);
    });
  }
}

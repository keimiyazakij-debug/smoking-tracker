(function () {
// view/badgeView.js

function renderBadges(earnedKeys = loadBadges()) {

  const earned = document.getElementById("earnedBadges");
  const all = document.getElementById("allBadges");

  if (earned) {
    earned.innerHTML = "";
    earnedKeys.forEach(key => {
      const badge = BADGES.find(b => b.id === key);
      if (!badge) return;

      const div = document.createElement("div");
      div.className = "badge earned";
      div.textContent = badge.label + " ✔";
      earned.appendChild(div);
    });
  }

  if (all) {
    all.innerHTML = "";
    BADGES.forEach(badge => {
      const has = earnedKeys.includes(badge.id);
      const div = document.createElement("div");
      div.className = "badge" + (has ? " earned" : " locked");
      div.textContent = badge.label + (has ? " ✔" : " 🔒");
      all.appendChild(div);
    });
  }
}

window.badgeView = { render: renderBadges };

})();
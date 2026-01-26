(function () {

// controller/badgeController.js

function updateBadges(ctx) {
  const events = badgeModel.evaluateBadges(ctx);

  if (events.length > 0) {
    ctx.badgesEarnedToday = events.map(e => e.id);

    const earned = badgeModel.loadEarnedBadges();
    saveBadges(earned);              // 既存永続化形式を維持
    badgeView.render(earned);
  }

  return events;
}

window.badgeController = {
  updateBadges
};

})();
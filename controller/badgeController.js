(function () {

// controller/badgeController.js

function updateBadges(ctx) {
  const events = window.badgeModel.evaluateBadges(ctx);

  if (events.length > 0) {
    ctx.badgesEarnedToday = events.map(e => e.id);

    const earned = window.badgeModel.loadEarnedBadges();
    window.badgeView.render(earned);
  }

  return events;
}

window.badgeController = {
  updateBadges
};

})();
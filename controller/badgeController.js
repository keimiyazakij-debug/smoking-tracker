(function () {

// controller/badgeController.js

function evaluateAndGrant(stats) {
  const events = window.badgeModel.evaluateBadges(stats);
  events.forEach(e => window.badgeView.grant(e));
  return events;
}

function updateBadges(ctx) {
  const events = evaluateAndGrant(ctx);

  if (events.length > 0) {
    ctx.badgesEarnedToday = events.map(e => e.id);

    const earned = window.badgeModel.loadEarnedBadges();
    window.badgeView.render(earned);
  }

  return events;
}

window.badgeController = {
  evaluateAndGrant,
  updateBadges
};

})();
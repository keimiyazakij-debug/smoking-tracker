// model/badgeModel.js

const BADGE_DONE_KEY = "badgeDone";

function loadBadgeDone() {
  try {
    return JSON.parse(localStorage.getItem(BADGE_DONE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBadgeDone(done) {
  localStorage.setItem(BADGE_DONE_KEY, JSON.stringify(done));
}

function evaluateBadges(ctx) {
  const done = loadBadgeDone();
  const events = [];

  BADGES.forEach(badge => {
    if (done[badge.id]) return;
    if (!badge.check(ctx)) return;

    done[badge.id] = {
      earnedAt: getDateKey()
    };
    events.push({
      type: "badge",
      id: badge.id,
      label: badge.label
    });
  });

  if (events.length > 0) {
    saveBadgeDone(done);
  }

  return events;
}

function loadEarnedBadges() {
  const done = loadBadgeDone();
  return done; // { badgeId: { earnedAt } }
}

window.badgeModel = {
  evaluateBadges,
  loadEarnedBadges
};

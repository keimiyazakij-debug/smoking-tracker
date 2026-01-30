// model/badgeModel.js
const BADGE_DONE_KEY = "badgeDone";

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function loadBadgeDone() {
  if (!hasLocalStorage()) return {};
  try {
    return JSON.parse(localStorage.getItem(BADGE_DONE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBadgeDone(done) {
  if (!hasLocalStorage()) return {};
  localStorage.setItem(BADGE_DONE_KEY, JSON.stringify(done));
}

function evaluateBadges(ctx) {
  if (!ctx) return [];
  const done = loadBadgeDone();
  const events = [];

  window.BADGES.forEach(badge => {
    if (done[badge.id]) return;
    if (!badge.check(ctx)) return;

    done[badge.id] = {
      earnedAt: window.common.getDateKey()
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
  return loadBadgeDone();
}

window.badgeModel = {
  evaluateBadges,
  loadEarnedBadges
};

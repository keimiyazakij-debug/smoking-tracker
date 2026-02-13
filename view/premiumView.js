(function () {
function open() {
  const overlay = document.getElementById("premiumOverlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
}

function close() {
  const overlay = document.getElementById("premiumOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}

const closeBtn = document.getElementById("closePremiumBtn");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.premiumController?.closePremiumView();
  });
}

const laterBtn = document.getElementById("premiumLaterBtn");
if (laterBtn) {
  laterBtn.addEventListener("click", () => {
    window.premiumController?.closePremiumView();
  });
}

const upgradeBtn = document.getElementById("premiumUpgradeBtn");
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", () => {
    window.premiumController?.upgrade();
  });
}

const settingsCard = document.getElementById("settingsPremiumCard");
if (settingsCard) {
  settingsCard.addEventListener("click", () => {
    if (typeof window.navigateTo === "function") {
      window.navigateTo("PremiumView");
    } else {
      window.premiumController?.openPremiumView();
    }
  });
}

window.premiumView = {
  open,
  close
};
})();


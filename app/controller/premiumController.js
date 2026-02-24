(function () {
let previousTabId = "main";

function openPremiumView() {
  const activeTab = document.querySelector(".tab.active");
  previousTabId = activeTab?.id || "main";
  if (window.premiumView?.open) {
    window.premiumView.open();
  }
}

function closePremiumView() {
  if (window.premiumView?.close) {
    window.premiumView.close();
  }
  if (typeof window.showTab === "function") {
    window.showTab(previousTabId || "main");
  }
}

function upgrade() {
  if (window.messageController?.enqueue) {
    window.messageController.enqueue({
      type: "msg",
      text: "アップグレード機能は準備中です。",
      priority: -1
    });
  }
}

// 共通遷移入口（詳細画面）
function navigateTo(name) {
  if (name === "PremiumView") {
    openPremiumView();
  }
}

window.premiumController = {
  openPremiumView,
  closePremiumView,
  upgrade
};
window.navigateTo = navigateTo;
})();

(function () {
let currentDateKey = null;

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey) {
  currentDateKey = dateKey;   // ★ 追加
  const overlay = document.getElementById("timelineOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  timelineView.render(dateKey);
}

// ===== 編集画面を開く =====
function openEditFromTimeline() {
    if (!currentDateKey) return;
    editModel.open(currentDateKey);
    editView.open(editModel.getState());
}

// ===== タイムライン画面の非表示 =====
function closeTimeline() {
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
}

window.openTimeline = openTimeline;
window.closeTimeline = closeTimeline;
window.openEditFromTimeline = openEditFromTimeline;
window.timelineController = { 
  openTimeline,
  closeTimeline,
  openEditFromTimeline
 };

 })();
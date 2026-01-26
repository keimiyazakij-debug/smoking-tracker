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

// ===== タイムライン画面の再表示 =====
function refreshTimeline(dateKey) {
  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  timelineView.render(dateKey);
}


// ===== 編集画面を開く =====
function openEditFromTimeline() {
    if (!currentDateKey) return;
    editController.openEdit(currentDateKey);
}

// ===== タイムライン画面の非表示 =====
function closeTimeline() {
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
}

// ===== タイムライン画面の表示状態取得 =====
function isOpenTimeline(){
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    return true;
  }else{
    return false;
  }
}


window.timelineController = { 
  openTimeline,
  closeTimeline,
  openEditFromTimeline,
  refreshTimeline,
  isOpenTimeline
 };

 })();
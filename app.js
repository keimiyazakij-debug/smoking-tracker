// グローバル変数の宣言
let currentTimelineDate = null;
let lastTodayKey = getDateKey();
let editTimes = [];

// イベント処理を集約する
// 初期表示時のタイマー起動
document.addEventListener("DOMContentLoaded", () => {
  // 初回表示
  lastTodayKey = getDateKey();

   // ===== 初回描画 =====
  updateMainDisplay();
  renderCalendar();
  updateBadges();

  // 1分ごとに日付チェック
  setInterval(checkDateRollover, 60 * 1000);

  // iOS対策：復帰時にも必ず確認
  window.addEventListener("focus", checkDateRollover);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDateRollover();
  });

  document.getElementById("smokeBtn").addEventListener("click", () => {
    addSmoke();
  });
});


// 更新系のとりまとめ
function afterLogChanged() {
  updateBadges();
  updateMainDisplay();
  renderCalendar();
}

// ===== タブ切替 =====
function showTab(id) {

  // ★ タイムラインが開いていたら閉じる
  closeTimeline();

  //画面描画処理（navタグのonClickで起動）
  if (id === "calendar") {
    resetCalendarToToday(); 
    renderCalendar();
  }
  if (id === "badgeTab") renderBadges();
  if (id === "settings") renderSettings();

  //Activeなブロックの切り替え
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // 設定タブ→他タブ切替時に保存
  if (id !== "settings") saveCurrentSettings();
}

// ===== 日付またぎ監視 =====
function checkDateRollover() {
  const nowKey = getDateKey();
  if (nowKey !== lastTodayKey) {
    console.log("[DATE ROLLOVER]", lastTodayKey, "→", nowKey);
    lastTodayKey = nowKey;

    // 日付が変わった時にやるべきこと
    updateMainDisplay();
    renderCalendar();
  }
}

// ===== カレンダー画面の前月表示 =====
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

// ===== カレンダー画面の翌月表示 =====
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

// ===== カレンダー画面を現在表示に戻す =====
function resetCalendarToToday() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
}

// ===== タイムライン画面の表示 =====
function openTimeline(dateKey) {
  currentTimelineDate = dateKey;   // ★ 追加
  const overlay = document.getElementById("timelineOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  renderTimelineForDate(dateKey);
}

// ===== タイムライン画面の非表示 =====
function closeTimeline() {
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
}


//　===== 喫煙記録修正画面の表示 =====
function openEdit() {
  if (!currentTimelineDate) return;

  const overlay = document.getElementById("editOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("editTitle").textContent =
    `${currentTimelineDate} を修正`;

  // 既存ログをフォームに反映
  const logs = loadLogs();
  const times = logs[currentTimelineDate] || [];


  if (times.length > 0) {
    editTimes = times.map(t => {
      const d = new Date(t);
      return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    });
  }

  document.getElementById("editDate").value = currentTimelineDate;
  document.getElementById("editCount").value = times.length;
  renderTimeTags();
}

//　===== 喫煙記録修正画面の非表示 =====
function closeEdit() {
  document.getElementById("editOverlay").classList.add("hidden");
  editTimes = [];                 // ★ 状態リセット
  const timeTags = document.getElementById("timeTags");
  if (timeTags) timeTags.innerHTML = "";
}

//　===== 喫煙記録追加ボタンの処理 =====
function addTimeTag() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  editTimes.push(`${hh}:${mm}`);
  renderTimeTags();
}

// バッジ評価・保存・再描画を一括で行う唯一の入口
function updateBadges() {
  const logs = loadLogs();
  const badges = evaluateBadges(logs); // badgeEngine.js
  saveBadges(badges);
  renderBadges();
}

// 設定画面でのプランの判定
function isPremium() {
  // 今は固定で false（将来ここを書き換える）
  return false;
}

// 設定画面でのデータ消去処理
function resetAll() {
  if (!confirm("すべての記録と設定が削除されます。よろしいですか？")) return;
  localStorage.clear();
  location.reload();
}

// ===== メッセージ =====
function showMessage(msg) {
  const m = document.getElementById("message");
  m.textContent = msg;
  setTimeout(()=>{ m.textContent=""; }, 3000);
}

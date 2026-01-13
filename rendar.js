let currentTimelineDate = null;
let editTimes = [];

// ===== タブ切替 =====
function showTab(id) {

  // ★ タイムラインが開いていたら閉じる
  closeTimeline();

  //画面描画処理（navタグのonClickで起動）
  if (id === "calendar") renderCalendar();
  if (id === "badgeTab") renderBadges();
  if (id === "settings") renderSettings();

  //Activeなブロックの切り替え
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // 設定タブ→他タブ切替時に保存
  if (id !== "settings") saveCurrentSettings();
}

// ===== メイン画面 =====
function updateMainDisplay() {
  const logs = loadLogs();
  const s = loadSettings();
  const today = new Date().toISOString().slice(0,10);
  const todayLogs = logs[today] || [];

  // 今日の本数表示
  document.getElementById("todayCountDisplay").textContent = `${todayLogs.length} / ${s.dailyTarget} 本`;

  // プログレスバー
  const pct = Math.min(100, todayLogs.length / s.dailyTarget * 100);
  document.getElementById("progress").style.width = pct + "%";

  // 禁煙時間表示（最後に吸った時間から）
  const lastTime = todayLogs.length ? new Date(todayLogs[todayLogs.length-1]) : null;
  const now = new Date();

  if (!lastTime) {
    document.getElementById("since").textContent = "禁煙中：今日まだ吸っていません";
  } else {
    const diffMs = now - lastTime;
    const diffMin = Math.floor(diffMs / 1000 / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffMinute = diffMin % 60;

    const hh = lastTime.getHours().toString().padStart(2,'0');
    const mm = lastTime.getMinutes().toString().padStart(2,'0');

    document.getElementById("since").textContent = 
      `禁煙中：${hh}時${mm}分から${diffMin}分`;
  }

  // 前回間隔は非表示
  document.getElementById("interval").textContent = "";
}

// ===== メイン画面ボタン用のイベントリスナー =====
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("smokeBtn").addEventListener("click", () => {
    const logs = loadLogs();
    const today = new Date().toISOString().slice(0,10);
    if (!logs[today]) logs[today] = [];
    logs[today].push(new Date().toISOString());
    saveLogs(logs);
    updateMainDisplay();
    checkBadges(); // 簡易バッジ更新
    });
});

// ===== メッセージ =====
function showMessage(msg) {
  const m = document.getElementById("message");
  m.textContent = msg;
  setTimeout(()=>{ m.textContent=""; }, 3000);
}


function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const year = currentYear;
  const month = currentMonth;

  const logs = loadLogs();
  const target = loadSettings().dailyTarget;
  const firstDay = new Date(year, month, 1).getDay(); // 0=日
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  
  /* ---------- 曜日ヘッダー ---------- */
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  week.forEach((w, i) => {
    const h = document.createElement("div");
    h.className = "calendar-head";
    h.textContent = w;
    if (i === 0) h.classList.add("calendar-day","red");
    if (i === 6) h.classList.add("calendar-day","blue");
    grid.appendChild(h);
  });

  /* ---------- 前月グレー ---------- */
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLastDate - i;
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = d;
    grid.appendChild(cell);
  }

  /* ---------- 今月 ---------- */
  for (let d = 1; d <= lastDate; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = logs[dateKey]?.length || 0;
    const dayObj = new Date(year, month, d);
    const dow = dayObj.getDay();

    // 前日キー
    const prevDate = new Date(year, month, d - 1);
    const prevKey =
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`; 
    const prevCount = logs[prevKey]?.length ?? null;    

    const cell = document.createElement("div");
    cell.className = "calendar-day";

    // 曜日色
    if (dow === 0) cell.classList.add("red");
    if (dow === 6) cell.classList.add("blue");

    // 祝日
    if (holidays[dateKey]) cell.classList.add("red");

    // 日付表示
    const todayKey = new Date().toISOString().slice(0,10);
    const isPast = dateKey < todayKey;
    const isToday = dateKey === todayKey;

    // 記録なし
    if (!logs.hasOwnProperty(dateKey)) {
      cell.classList.add("no-log");
    }

    let countText = "";

    // ログが存在する日
    const isProgress =
      prevCount !== null &&
      prevCount > 0 &&          // ← これを追加
      count > 0 &&
      count < prevCount &&
      count <= target &&
      !cell.classList.contains("success") &&
      !cell.classList.contains("over");

    if (logs[dateKey]) {
      const count = logs[dateKey]?.length ?? null;

      countText = `${count}本`;

      // 過去日の禁煙成功
      if (count === 0 && dateKey < todayKey) {
        cell.classList.add("success");
      }

      // 目標超過
      if (count > target) {
        cell.classList.add("over");
      }

      

    }
    // HTML構造で描画
    cell.innerHTML = `
      <div class="day-number">${d}${holidays[dateKey] ? " 🎌" : ""}</div>
      <div class="day-count">${countText}</div>
    `;

    if (isProgress) {
      const mark = document.createElement("div");
      mark.className = "progress-mark";
      mark.textContent = "·";
      cell.appendChild(mark);
    }

    cell.addEventListener("click", () => {
      const logs = loadLogs();

      if (logs[dateKey]) {
        // 入力済み → タイムライン
        openTimeline(dateKey);
      } else {
        // 未入力 → 修正（新規入力）
        currentTimelineDate = dateKey;
        openEdit();
      }
    });
    grid.appendChild(cell);
  }
  
  /* ---------- 翌月グレー ---------- */
  const totalCells = firstDay + lastDate;
  const remain = (7 - (totalCells % 7)) % 7;

  for (let i = 1; i <= remain; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = i;
    grid.appendChild(cell);
  }

  /* ---------- タイトル更新 ---------- */
  const title = document.getElementById("calendarTitle");
  if (title) title.textContent = `${year}年 ${month + 1}月`;
}


function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function openTimeline(dateKey) {
  currentTimelineDate = dateKey;   // ★ 追加
  const overlay = document.getElementById("timelineOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("timelineTitle").textContent =
    `${dateKey} のタイムライン`;

  renderTimelineForDate(dateKey);
}

function closeTimeline() {
  const overlay = document.getElementById("timelineOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("hidden");
  }
}

function renderTimelineForDate(dateKey) {
  const container = document.getElementById("timelineList");
  container.innerHTML = "";

  const logs = loadLogs();
  const times = (logs[dateKey] || []).map(t => new Date(t));

  // 時間帯ごとに整理
  const map = {};
  times.forEach(t => {
    const h = t.getHours();
    const mm = t.getMinutes().toString().padStart(2,'0');
    const hh = h.toString().padStart(2,'0');
    if (!map[h]) map[h] = [];
    map[h].push(`${hh}:${mm}`);
  });

  // 0〜23時を必ず描画
  for (let h = 0; h < 24; h++) {
    const row = document.createElement("div");
    row.className = "timeline-row";

    const hour = document.createElement("div");
    hour.className = "timeline-hour";
    hour.textContent = `${h}:00–${h+1}:00`;

    const log = document.createElement("div");
    log.className = "timeline-log";

    if (map[h]) {
      map[h].forEach(t => {
        const span = document.createElement("span");
        span.textContent = t;
        log.appendChild(span);
      });
    }

    container.appendChild(hour);
    container.appendChild(log);
  }
}

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

function closeEdit() {
  document.getElementById("editOverlay").classList.add("hidden");
  editTimes = [];                 // ★ 状態リセット
  const timeTags = document.getElementById("timeTags");
  if (timeTags) timeTags.innerHTML = "";
}

function saveEdit() {
  const dateInput = document.getElementById("editDate");
  if (!dateInput) {
    console.error("editDate not found");
    return;
  }

  const date = dateInput.value;
  if (!date) {
    alert("日付を選択してください");
    return;
  }

  const logs = loadLogs();

  // editTimes（["10:30","14:10"] など）を保存用ISOに変換
  const newTimes = editTimes
    .slice()
    .sort()
    .filter(t => t) // 空文字対策
    .map(t => {
      return new Date(`${date}T${t}:00`).toISOString();
    });

  // 完全上書き
  logs[date] = newTimes;
  saveLogs(logs);

  // 画面更新
  closeEdit();
  closeTimeline();
  renderCalendar();
  showMessage("修正しました");
}

function renderTimeTags() {
  const container = document.getElementById("timeTags");
  container.innerHTML = "";

  editTimes.sort();
  editTimes.forEach((time, index) => {
    const tag = document.createElement("div");
    tag.className = "time-tag";

    const input = document.createElement("input");
    input.type = "time";
    input.value = time;
    input.oninput = () => {
      editTimes[index] = input.value;
    };

    const del = document.createElement("button");
    del.textContent = "✕";
    del.onclick = () => {
      editTimes.splice(index, 1);
      renderTimeTags();
    };

    tag.appendChild(input);
    tag.appendChild(del);
    container.appendChild(tag);
  });
}

function addTimeTag() {
  editTimes.push("12:00");
  renderTimeTags();
}



// バッジ管理画面の表示
function renderBadges() {

  const badges = loadBadges();

  const container = document.getElementById("earnedBadges");
  if(container) {
    container.innerHTML = "";
    badges.forEach(b => {
      const li = document.createElement("li");
      li.textContent = badgeMaster.find(x=>x.key===b)?.label || b;
      container.appendChild(li);
    });
  }

  // バッジ管理画面
  const all = document.getElementById("allBadges");
  if(all){
    all.innerHTML = "";
    badgeMaster.forEach(b => {
      const div = document.createElement("div");
      div.className = "badge" + (badges.includes(b.key) ? "" : " locked");
      div.textContent = b.label + (badges.includes(b.key) ? " ✔" : " 🔒");
      all.appendChild(div);
    });
  }
}

function checkBadges() {
  const logs = loadLogs();
  const today = new Date().toISOString().slice(0,10);
  const todayLogs = logs[today] || [];
  const badges = loadBadges();

  let lastTime = todayLogs[todayLogs.length-1];
  if (!lastTime) return;
  let diffMin = Math.floor((Date.now() - new Date(lastTime))/1000/60);

  badgeMaster.forEach(b => {
    if(diffMin >= b.condition && !badges.includes(b.key)) {
      badges.push(b.key);
      showMessage(`${b.label}達成！`);
    }
  });
  saveBadges(badges);
  renderBadges();
}

// プランの判定
function isPremium() {
  // 今は固定で false（将来ここを書き換える）
  return false;
}

// 設定画面
function renderSettings() {
  const el = document.getElementById("planInfo");
  if (!el) return;

  if (isPremium()) {
    el.innerHTML = `
      <strong>プレミアム</strong><br>
      ・記録は無期限<br>
      ・統計情報が表示されます<br>
      ・広告が軽減されます
    `;
  } else {
    el.innerHTML = `
      <strong>無料版</strong><br>
      ・記録は直近30日まで<br>
      ・広告が表示されます
    `;
  }
}

// データ消去
function resetAll() {
  if (!confirm("すべての記録と設定が削除されます。よろしいですか？")) return;
  localStorage.clear();
  location.reload();
}
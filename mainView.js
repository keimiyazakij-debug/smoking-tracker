// ===== メイン画面の描画 =====
function updateMainDisplay() {
  const logs = loadLogs();
  const s = loadSettings();
  const today = getDateKey();
  const todayLogs = logs[today] || [];

  // 今日の日付表示
  document.getElementById("todayDisplay").textContent = getDateKey();

  // 今日の本数表示
  document.getElementById("todayCountDisplay").textContent = `${todayLogs.length} / ${s.dailyTarget} 本`;

  // プログレスバー
  const pct = Math.min(100, todayLogs.length / s.dailyTarget * 100);
  document.getElementById("progress").style.width = pct + "%";

  // 禁煙時間表示（最後に吸った時間から）
  const lastTime = getLastSmokeTime(logs)
  const todaylastTime = todayLogs.length ? new Date(todayLogs[todayLogs.length-1]) : null;
  const sinceEl = document.getElementById("since");
  sinceEl.innerHTML="";
  if(!todaylastTime){
    sinceEl.innerHTML = "禁煙中（今日はまだ吸っていません）" 
  }

  if(lastTime){
    const now = new Date();
    const diffMs = now - lastTime;
    const diffMin = Math.floor(diffMs / 1000 / 60);
    const durationText = formatDurationFromMinutes(diffMin);
    const hh = lastTime.getHours().toString().padStart(2,'0');
    const mm = lastTime.getMinutes().toString().padStart(2,'0');
    const timeText = `禁煙中：${hh}時${mm}分から ${durationText}経過`;
    sinceEl.innerHTML += (sinceEl.textContent ? "<br>" : "") + timeText;
  }


  // 前回間隔は非表示
  document.getElementById("interval").textContent = "";
}

// ===== カレンダー画面の描画 =====
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

    // 日付取得
    const todayKey = getDateKey();
    const isPast = dateKey < todayKey;
    const isToday = dateKey === todayKey;

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

    // 本日の表示
    if (isToday) cell.classList.add("today");
    if (isPast) cell.classList.add("past");

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

// ===== タイムライン画面の描画 =====
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

//　===== 喫煙記録修正画面の描画 =====
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
    del.type = "button"; // ← これ重要（フォーム誤動作防止）
    del.textContent = "✕";

    del.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      editTimes.splice(index, 1);
      renderTimeTags();
    });
    tag.appendChild(input);
    tag.appendChild(del);
    container.appendChild(tag);
  });
}

// 設定画面の描画
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

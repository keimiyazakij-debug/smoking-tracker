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
  const grid = getCalendarGrid();
  if (!grid) return;

  clearCalendar(grid);

  const ctx = buildCalendarContext();

  renderWeekHeader(grid);
  renderPrevMonth(grid, ctx);
  renderCurrentMonth(grid, ctx);
  renderNextMonth(grid, ctx);
  updateCalendarTitle(ctx);
}

function getCalendarGrid() {
  return document.getElementById("calendarGrid");
}

function clearCalendar(grid) {
  grid.innerHTML = "";
}

// ===== カレンダー用のコンテキストの作成 =====
function buildCalendarContext() {
  const year = currentYear;
  const month = currentMonth;

  return {
    year,
    month,
    logs: loadLogs(),
    target: loadSettings().dailyTarget,
    todayKey: getDateKey(),
    firstDay: new Date(year, month, 1).getDay(),
    lastDate: new Date(year, month + 1, 0).getDate(),
    prevLastDate: new Date(year, month, 0).getDate(),
    downStreak: 0
  };
}

// カレンダーの曜日ヘッダーの作成
function renderWeekHeader(grid) {
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  week.forEach((w, i) => {
    const h = document.createElement("div");
    h.className = "calendar-head";
    h.textContent = w;
    if (i === 0) h.classList.add("red");
    if (i === 6) h.classList.add("blue");
    grid.appendChild(h);
  });
}

// 今月に含まれる前月部分の作成
function renderPrevMonth(grid, ctx) {
  const { firstDay, prevLastDate } = ctx;

  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = prevLastDate - i;
    grid.appendChild(cell);
  }
}

// 今月に含まれる翌月部分の作成
function renderNextMonth(grid, ctx) {
  const { firstDay, lastDate } = ctx;
  const total = firstDay + lastDate;
  const remain = (7 - (total % 7)) % 7;

  for (let i = 1; i <= remain; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = i;
    grid.appendChild(cell);
  }
}

// カレンダー１月分のセルを作成
function renderCurrentMonth(grid, ctx) {
  for (let d = 1; d <= ctx.lastDate; d++) {
    const cell = createDayCell(d, ctx);
    grid.appendChild(cell);
  }
}

// カレンダーの１日分のセルを作成
function createDayCell(d, ctx) {
  const { year, month, logs, target, todayKey } = ctx;
  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const count = logs[dateKey]?.length ?? null;
  const prevInfo = getPrevDayInfo(dateKey, logs);
  const prevCount = prevInfo?.count ?? null;

  const isPast = dateKey < todayKey;
  const isToday = dateKey === todayKey;

  const cell = document.createElement("div");
  cell.className = "calendar-day";

  decorateDayCell(cell, d, count, dateKey, ctx);
  applyEvaluation(cell, count, prevCount, ctx);

  attachDayEvents(cell, dateKey, logs);

  return cell;
}

// カレンダーの１日分のセルを装飾
function decorateDayCell(cell, d, count, dateKey, ctx) {
  const { year, month, logs, todayKey } = ctx;

  const dow = new Date(year, month, d).getDay();
  const isPast = dateKey < todayKey;
  const isToday = dateKey === todayKey;

  // 曜日色
  if (dow === 0) cell.classList.add("red");
  if (dow === 6) cell.classList.add("blue");

  // 今日・過去
  if (isToday) cell.classList.add("today");
  if (isPast) cell.classList.add("past");

  // 記録なし
  if (!logs.hasOwnProperty(dateKey)) {
    cell.classList.add("no-log");
  }

  // 中身
  cell.innerHTML = `
    <div class="day-number">${d}</div>
    <div class="day-count">${count !== null ? `${count}本` : ""}</div>
  `;
}

// １日の評価を実行
function applyEvaluation(cell, count, prevCount, ctx) {
  const evalType = getDayEvaluation({
    count,
    prevCount,
    target: ctx.target,
    isPast: cell.classList.contains("past")
  });

  if (!evalType) return;

  // 🔥 streak 管理（ここが重要）
  if (evalType === "down") {
    ctx.downStreak++;
  } else if (evalType === "up") {
    ctx.downStreak = 0;
  }
  // same / success は streak 維持

  const diff =
    prevCount !== null && count !== null ? count - prevCount : 0;

  const mark = createEvaluationMark(evalType, ctx.downStreak, diff);
  if (mark) cell.appendChild(mark);

  // ✨ 3日以上減少ボーナス
  if (ctx.downStreak >= 3 && evalType === "down") {
    const bonus = document.createElement("div");
    bonus.className = "calendar-sparkle";
    bonus.textContent = "✨";

    bonus.addEventListener("click", (e) => {
        e.stopPropagation();
        showMessage(`減少が${ctx.downStreak}日連続しています！`);
      });
    cell.appendChild(bonus);
  }
}

// カレンダーの１日とイベントを紐づけ
function attachDayEvents(cell, dateKey, logs) {
  cell.addEventListener("click", () => {
    if (logs[dateKey]) {
      openTimeline(dateKey);
    } else {
      currentTimelineDate = dateKey;
      openEdit();
    }
  });
}

// カレンダーに表示する評価系のアイコンの表示
function createEvaluationMark(evalType, downStreak, diff) {
  let markText = "";
  let markClass = "";

  if (evalType === "down") {
    markText = downStreak >= 2 ? "★" : "☆";
    markClass = "calendar-mark mark-down";
  }

  if (evalType === "success") {
    markText = "🏆";
    markClass = "calendar-mark mark-success";
  }

  if (evalType === "same") {
    markText = "＝";
    markClass = "calendar-mark mark-same";
  }

  if (evalType === "up") {
    markText = "⚠";
    markClass = "calendar-mark mark-up";
  }

  if (!markText) return null;

  const mark = document.createElement("div");
  mark.className = markClass;
  mark.textContent = markText;

  mark.addEventListener("click", (e) => {
    e.stopPropagation();
    const msg = getEvaluationMessage(evalType, diff, downStreak);
    if (msg) showMessage(msg);
  });

  return mark;
}

// カレンダーの先頭部にメッセージを表示
function updateCalendarTitle(ctx) {
  const title = document.getElementById("calendarTitle");
  if (!title) return;

  title.textContent = `${ctx.year}年 ${ctx.month + 1}月`;
}

/*
// ===== カレンダー画面の描画 =====
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const year = currentYear;
  const month = currentMonth;

  const logs = loadLogs();
  const target = loadSettings().dailyTarget;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const todayKey = getDateKey();
  let downStreak = 0;

  // ---------- 曜日ヘッダー ---------- 
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  week.forEach((w, i) => {
    const h = document.createElement("div");
    h.className = "calendar-head";
    h.textContent = w;
    if (i === 0) h.classList.add("red");
    if (i === 6) h.classList.add("blue");
    grid.appendChild(h);
  });

  // ---------- 前月 ---------- 
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = prevLastDate - i;
    grid.appendChild(cell);
  }

  // ---------- 今月 ---------- 
  for (let d = 1; d <= lastDate; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = logs[dateKey]?.length ?? null;

    const prevInfo = getPrevDayInfo(dateKey, logs);
    const prevCount = prevInfo ? prevInfo.count : null;

    const isPast = dateKey < todayKey;
    const isToday = dateKey === todayKey;

    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.style.position = "relative";

    const dow = new Date(year, month, d).getDay();
    if (dow === 0) cell.classList.add("red");
    if (dow === 6) cell.classList.add("blue");

    if (isToday) cell.classList.add("today");
    if (isPast) cell.classList.add("past");
    if (!logs.hasOwnProperty(dateKey)) cell.classList.add("no-log");

    cell.innerHTML = `
      <div class="day-number">${d}</div>
      <div class="day-count">${count !== null ? `${count}本` : ""}</div>
    `;

    // ===== 評価判定 ===== 
    const evalType = getDayEvaluation({
      count,
      prevCount,
      target,
      isPast
    });

    let markText = "";
    let markClass = "";
    let diff = prevCount !== null && count !== null ? count - prevCount : 0;

    if (evalType === "down") {
      downStreak++;
      markText = downStreak >= 2 ? "★" : "☆";
      markClass = "calendar-mark mark-down";
    } else if (evalType !== null) {
      downStreak = 0;
    }

    if (evalType === "success") {
      markText = "🏆";
      markClass = "calendar-mark mark-success";
    }

    if (evalType === "same") {
      markText = "＝";
      markClass = "calendar-mark mark-same";
    }

    if (evalType === "up") {
      markText = "⚠";
      markClass = "calendar-mark mark-up";
    }

    if (markText) {
      const mark = document.createElement("div");
      mark.className = markClass;
      mark.textContent = markText;

      mark.addEventListener("click", (e) => {
        e.stopPropagation();
        const msg = getEvaluationMessage(evalType, diff, downStreak);
        if (msg) showMessage(msg);
      });
      cell.appendChild(mark);
    }

    // ===== ✨ ボーナス ===== 
    if (downStreak >= 3) {
      addCalendarMark(dayCell, "✨", {
        type: "streak",
        streak: downStreak
      });
    }

    cell.addEventListener("click", () => {
      if (logs[dateKey]) {
        openTimeline(dateKey);
      } else {
        currentTimelineDate = dateKey;
        openEdit();
      }
    });

    grid.appendChild(cell);
  }

  // ---------- 翌月 ---------- 
  const remain = (7 - ((firstDay + lastDate) % 7)) % 7;
  for (let i = 1; i <= remain; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day gray";
    cell.textContent = i;
    grid.appendChild(cell);
  }

  const title = document.getElementById("calendarTitle");
  if (title) title.textContent = `${year}年 ${month + 1}月`;
}
*/

//　連続達成アイコンのコンテナ作成
function addCalendarMark(cell, icon, meta) {
  const mark = document.createElement("div");
  mark.className = "calendar-mark";
  mark.textContent = icon;

  mark.addEventListener("click", (e) => {
    e.stopPropagation();

    const msg = getEvaluationMessage(
      meta.type,
      meta.diff,
      meta.streak
    );

    if (msg) showToast(msg);
  });

  cell.appendChild(mark);
}


// カレンダー上の評価判定
function getDayEvaluation({ count, prevCount, target, isPast }) {
  if (!isPast || prevCount === null) return null;
  if (count === 0) return "success";
  if (count < prevCount) return "down";
  if (count > prevCount) return "up";
  return "same";
}

// カレンダー上の評価メッセージ
function getEvaluationMessage(type, diff, streak) {
  switch (type) {
    case "success":
      return "今日は禁煙達成です 🏆\nこの1日は確実な実績です。";
    case "down":
      if (streak >= 3) {
        return "3日以上、減少が続いています ✨\n確実に習慣が変わっています。";
      }
      if (streak >= 2) {
        return "減少が続いています ★\nこの流れ、とても良いです。";
      }
      return "前日より減りました ☆\n良い一歩です。";
    case "same":
      return "前日と同じ本数です。\n維持できています 👍";
    case "up":
      return `前日より +${diff}本。\nでもまた減らせます 👍`;
    default:
      return "";
  }
}

// ===== 前日日付取得（月またぎ対応） =====
function getPrevDayInfo(dateKey, logs) {
  const date = new Date(dateKey);
  date.setDate(date.getDate() - 1);
  const prevKey = getDateKey(date);

  if (!logs.hasOwnProperty(prevKey)) {
    return null;
  }

  return {
    key: prevKey,
    count: logs[prevKey].length
  };
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

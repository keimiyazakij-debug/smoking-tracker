(function () {
// view/calendarView.js

function render(ctx) {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  const total = ctx.firstDay + ctx.lastDate;
  const remain = (7 - (total % 7)) % 7;
  const weeks = Math.ceil((total + remain) / 7);
  grid.style.setProperty("--calendar-rows", String(weeks));
  grid.innerHTML = "";

  renderWeekHeader(grid);
  renderPrevMonth(grid, ctx);
  renderCurrentMonth(grid, ctx);
  renderNextMonth(grid, ctx);
  updateTitle(ctx);
}

function renderWeekHeader(grid) {
  ["日","月","火","水","木","金","土"].forEach((w, i)=>{
    const h=document.createElement("div");
    h.className="calendar-head";
    if (i === 0) h.classList.add("sunday");
    if (i === 6) h.classList.add("saturday");
    h.textContent=w;
    grid.appendChild(h);
  });
}

function renderPrevMonth(grid, ctx) {
  for (let i = ctx.firstDay - 1; i >= 0; i--) {
    const c = document.createElement("div");
    c.className = "calendar-day gray";
    // 当月セルと同じ表示形式に揃える（count-bg 構造）
    c.innerHTML = `
      <div class="day-number">${ctx.prevLastDate - i}</div>
      <div class="count-bg empty"><span class="count-number"></span></div>
    `;
    grid.appendChild(c);
  }
}

function renderNextMonth(grid, ctx) {
  const total = ctx.firstDay + ctx.lastDate;
  const remain = (7 - (total % 7)) % 7;
  for (let i=1;i<=remain;i++){
    const c=document.createElement("div");
    c.className="calendar-day gray";
    // 当月セルと同じ表示形式に揃える（count-bg 構造）
    c.innerHTML = `
      <div class="day-number">${i}</div>
      <div class="count-bg empty"><span class="count-number"></span></div>
    `;
    grid.appendChild(c);
  }
}

function renderCurrentMonth(grid, ctx) {
  ctx.days.forEach(day => {
    const cell = document.createElement("div");
    cell.className="calendar-day";
    decorate(cell, day, ctx);

    cell.onclick = ()=> calendarController.onDayClick(day.dateKey);
    grid.appendChild(cell);
  });
}

function decorate(cell, day, ctx) {
  const dow = new Date(ctx.year, ctx.month, day.day).getDay();
  if (dow === 0) cell.classList.add("sunday");
  if (dow === 6) cell.classList.add("saturday");
  if (day.isHoliday) cell.classList.add("holiday");
  if (day.holidayName) cell.title = `祝日: ${day.holidayName}`;

  // Design System v1.0: 選択日を primary 背景で表示
  if (day.dateKey === ctx.selectedDateKey) cell.classList.add("selected");
  if (day.dateKey===ctx.todayKey) cell.classList.add("today");
  if (day.dateKey<ctx.todayKey) cell.classList.add("past");
  if (day.status === "unrecorded") cell.classList.add("unrecorded");
  if (day.status === "success") cell.classList.add("success");
  if (day.status === "smoke") cell.classList.add("smoke");
  if (day.isLocked) cell.classList.add("locked");
  // Design System v1.0: 本数は数字のみ（単位なし）+ count-bg を子要素化
  cell.innerHTML = `
    <div class="day-number">${day.day}</div>
    <div class="count-bg">
      <span class="count-number">${day.count != null ? `${day.count}` : ""}</span>
    </div>
  `;

  // ロック日は背景ロジックよりロック状態を優先
  if (day.isLocked) {
    const lock = document.createElement("span");
    lock.className = "lock-mark";
    lock.textContent = "🔒";
    cell.appendChild(lock);
    return;
  }

  if (day.hasMemo) {
    const dot = document.createElement("span");
    dot.className = "memo-indicator";
    cell.appendChild(dot);
  }

  const countBgEl = cell.querySelector(".count-bg");
  if (countBgEl) {
    if (day.status === "unrecorded") {
      countBgEl.classList.add("count-unrecorded");
    } else if (day.count != null) {
      if (day.count <= (ctx.target ?? 0)) {
        countBgEl.classList.add("count-achieved");
      } else {
        countBgEl.classList.add("count-exceeded");
      }
    }
  }
}

function updateTitle(ctx){
  const t=document.getElementById("calendarTitle");
  if(t) t.textContent=`${ctx.year}年 ${ctx.month+1}月`;
}

window.calendarView = { render };

})();

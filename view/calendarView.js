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
  ["日","月","火","水","木","金","土"].forEach((w,i)=>{
    const h=document.createElement("div");
    h.className="calendar-head";
    h.textContent=w;
    if(i===0) h.classList.add("red");
    if(i===6) h.classList.add("blue");
    grid.appendChild(h);
  });
}

function renderPrevMonth(grid, ctx) {
  for (let i = ctx.firstDay - 1; i >= 0; i--) {
    const c = document.createElement("div");
    c.className = "calendar-day gray";
    c.innerHTML = `<div class="day-number">${ctx.prevLastDate - i}</div><div class="day-count"></div>`;
    grid.appendChild(c);
  }
}

function renderNextMonth(grid, ctx) {
  const total = ctx.firstDay + ctx.lastDate;
  const remain = (7 - (total % 7)) % 7;
  for (let i=1;i<=remain;i++){
    const c=document.createElement("div");
    c.className="calendar-day gray";
    c.innerHTML = `<div class="day-number">${i}</div><div class="day-count"></div>`;
    grid.appendChild(c);
  }
}

function renderCurrentMonth(grid, ctx) {
  ctx.days.forEach(day => {
    const cell = document.createElement("div");
    cell.className="calendar-day";
    decorate(cell, day, ctx);
    applyMark(cell, day);

    cell.onclick = ()=> calendarController.onDayClick(
      day.dateKey,
      day.hasLog
    );
    grid.appendChild(cell);
  });
}

function decorate(cell, day, ctx) {
  const dow = new Date(ctx.year, ctx.month, day.day).getDay();
  if (dow===0) cell.classList.add("red");
  if (dow===6) cell.classList.add("blue");
  if (day.dateKey===ctx.todayKey) cell.classList.add("today");
  if (day.dateKey<ctx.todayKey) cell.classList.add("past");
  if (!day.hasLog) cell.classList.add("no-log");
  cell.innerHTML = `<div class="day-number">${day.day}</div><div class="day-count">${day.count!=null?`${day.count}本`:""}</div>`;
  const countEl = cell.querySelector(".day-count");
  if (countEl && day.count != null && ctx.target != null) {
    if (day.count <= ctx.target) {
      countEl.classList.add("count-ok");
    } else if (day.count <= ctx.target + 3) {
      countEl.classList.add("count-warn");
    } else {
      countEl.classList.add("count-bad");
    }
  }
}

function applyMark(cell, day) {
  const type = day.evalType;
  if (!type) return;
  let text="", cls="";
  if (type==="success"){ text="🏆"; cls="calendar-mark mark-success"; }
  if (type==="down"){ text=day.downStreak>=2?"★":"☆"; cls="calendar-mark mark-down"; }
  if (type==="same"){ text="＝"; cls="calendar-mark mark-same"; }
  if (type==="up"){ text="⚠"; cls="calendar-mark mark-up"; }
  if (!text) return;

  const m=document.createElement("div");
  m.className=cls; m.textContent=text;
  m.onclick=(e)=>{ 
    e.stopPropagation(); 
    window.messageController.enqueue(
      {type: "msg",
       text: getMsg(type, (day.count??0)-(day.prevCount??0), day.downStreak),
       priority: -1}
    );
   };
  cell.appendChild(m);
}

function getMsg(type, diff, streak){
  if(type==="success") return "今日は禁煙達成です 🏆";
  if(type==="down") return streak>=3?"3日以上減少が継続 ✨":"前日より減りました ☆";
  if(type==="same") return "前日と同じ本数です";
  if(type==="up") return `前日より +${diff}本`;
  return "";
}

function updateTitle(ctx){
  const t=document.getElementById("calendarTitle");
  if(t) t.textContent=`${ctx.year}年 ${ctx.month+1}月`;
}

window.calendarView = { render };

})();

(function () {
// view/calendarView.js

const prevBtn = document.getElementById("calendarPrev");
const nextBtn = document.getElementById("calendarNext");

if (prevBtn) prevBtn.onclick = calendarController.prevMonth;
if (nextBtn) nextBtn.onclick = calendarController.nextMonth;


function render(ctx) {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
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
    c.textContent = ctx.prevLastDate - i;
    grid.appendChild(c);
  }
}

function renderNextMonth(grid, ctx) {
  const total = ctx.firstDay + ctx.lastDate;
  const remain = (7 - (total % 7)) % 7;
  for (let i=1;i<=remain;i++){
    const c=document.createElement("div");
    c.className="calendar-day gray";
    c.textContent=i;
    grid.appendChild(c);
  }
}

function renderCurrentMonth(grid, ctx) {
  let downStreak = 0;

  for (let d=1; d<=ctx.lastDate; d++) {
    const dateKey = `${ctx.year}-${String(ctx.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const count = ctx.logs[dateKey]?.length ?? null;
    const prev = calendarModel.getPrevDayInfo(dateKey, ctx.logs);
    const isPast = dateKey < ctx.todayKey;

    const evalType = calendarModel.evaluateDay({
      count,
      prevCount: prev?.count ?? null,
      target: ctx.target,
      isPast
    });

    if (evalType === "down") downStreak++;
    else if (evalType === "up") downStreak = 0;

    const cell = document.createElement("div");
    cell.className="calendar-day";
    decorate(cell, d, dateKey, count, ctx);
    applyMark(cell, evalType, downStreak, count, prev?.count);

    cell.onclick = ()=> calendarController.onDayClick(dateKey, !!ctx.logs[dateKey]);
    grid.appendChild(cell);
  }
}

function decorate(cell, d, dateKey, count, ctx) {
  const dow = new Date(ctx.year, ctx.month, d).getDay();
  if (dow===0) cell.classList.add("red");
  if (dow===6) cell.classList.add("blue");
  if (dateKey===ctx.todayKey) cell.classList.add("today");
  if (dateKey<ctx.todayKey) cell.classList.add("past");
  if (!ctx.logs.hasOwnProperty(dateKey)) cell.classList.add("no-log");
  cell.innerHTML = `<div class="day-number">${d}</div><div class="day-count">${count!=null?`${count}本`:""}</div>`;
}

function applyMark(cell, type, streak, count, prevCount) {
  if (!type) return;
  let text="", cls="";
  if (type==="success"){ text="🏆"; cls="calendar-mark mark-success"; }
  if (type==="down"){ text=streak>=2?"★":"☆"; cls="calendar-mark mark-down"; }
  if (type==="same"){ text="＝"; cls="calendar-mark mark-same"; }
  if (type==="up"){ text="⚠"; cls="calendar-mark mark-up"; }
  if (!text) return;

  const m=document.createElement("div");
  m.className=cls; m.textContent=text;
  m.onclick=(e)=>{ 
    e.stopPropagation(); 
    window.messageController.enqueue(
      {type: "msg",
       text: getMsg(type, (count??0)-(prevCount??0), streak)}
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
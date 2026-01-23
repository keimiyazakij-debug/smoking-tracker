(function () {
// view/dailyTaskView.js

let overlay = null;

function open(dateKey, tasks) {
  if (!overlay) overlay = create();
  render(dateKey, tasks);
  overlay.classList.remove("hidden");
}

function close() {
  if (overlay) overlay.classList.add("hidden");
}

function create() {
  const o = document.createElement("div");
  o.className = "overlay daily-challenge hidden";
  o.innerHTML = `
    <div class="overlay-content">
      <div class="overlay-header">
        <button id="dcPrev">◀</button>
        <h2 id="dcTitle"></h2>
        <button id="dcNext">▶</button>
      </div>
      <div id="dcList" class="challenge-list"></div>
      <div class="overlay-footer">
        <button id="dcClose">閉じる</button>
      </div>
    </div>
  `;

  o.querySelector("#dcClose").onclick = close;
  o.querySelector("#dcPrev").onclick = () => dailyTaskController.move(-1);
  o.querySelector("#dcNext").onclick = () => dailyTaskController.move(1);

  document.body.appendChild(o);
  return o;
}

function render(dateKey, tasks) {
  document.getElementById("dcTitle").textContent =
    dateKey === getDateKey()
      ? "今日のチャレンジ"
      : `${dateKey} のチャレンジ`;

  const list = document.getElementById("dcList");
  list.innerHTML = "";

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "challenge-item" + (t.done ? " done" : "");
    div.textContent = t.label;
    list.appendChild(div);
  });

  // ▼ 追加：未来日なら Next を隠す
  const nextBtn = document.getElementById("dcNext");
  nextBtn.style.visibility =
    dateKey >= getDateKey() ? "hidden" : "visible";}

window.dailyTaskView = { open, close };

})();
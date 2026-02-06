(function () {
// view/dailyTaskView.js

let overlay = null;

function open(state) {
  if (!overlay) overlay = create();
  render(state);
  overlay.classList.remove("hidden");
}

function close() {
  if (overlay) overlay.classList.add("hidden");
}

function isOpen() {
  return !!overlay && !overlay.classList.contains("hidden");
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

function render(state) {
  document.getElementById("dcTitle").textContent = state.title;

  const list = document.getElementById("dcList");
  list.innerHTML = "";

  state.tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "challenge-item" + (t.done ? " done" : "");
    div.textContent = t.label;
    list.appendChild(div);
  });

  // ▼ 追加：未来日なら Next を隠す
  const nextBtn = document.getElementById("dcNext");
  nextBtn.style.visibility = state.canNext ? "visible" : "hidden";
}

window.dailyTaskView = { open, close, isOpen };

})();

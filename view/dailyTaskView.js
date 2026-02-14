(function () {
// view/dailyTaskView.js

let isBound = false;

function open(state) {
  ensureBind();
  render(state);
  if (typeof window.showTab === "function") {
    window.showTab("gameChallenge");
  }
}

function close() {
  if (typeof window.showTab === "function") {
    window.showTab("game");
  }
}

function isOpen() {
  const tab = document.getElementById("gameChallenge");
  return !!(tab && tab.classList.contains("active"));
}

function ensureBind() {
  if (isBound) return;
  const backBtn = document.getElementById("dcBack");
  const prevBtn = document.getElementById("dcPrev");
  const nextBtn = document.getElementById("dcNext");
  if (!backBtn || !prevBtn || !nextBtn) return;
  backBtn.onclick = close;
  prevBtn.onclick = () => dailyTaskController.move(-1);
  nextBtn.onclick = () => dailyTaskController.move(1);
  isBound = true;
}

function render(state) {
  const titleEl = document.getElementById("dcTitle");
  const rec = document.getElementById("dcRecommended");
  const list = document.getElementById("dcList");
  if (!titleEl || !rec || !list) return;
  titleEl.textContent = state.title;
  if (rec) rec.textContent = state.recommendedTaskLabel || "";
  list.innerHTML = "";

  state.tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "challenge-item" + (t.done ? " done" : "");
    if (state.recommendedTaskId && t.id === state.recommendedTaskId) {
      // 今日の提案タスクを昇格表示
      div.classList.add("recommended");
    }
    div.textContent = t.label;
    list.appendChild(div);
  });

  // ▼ 追加：未来日なら Next を隠す
  const nextBtn = document.getElementById("dcNext");
  if (nextBtn) nextBtn.style.visibility = state.canNext ? "visible" : "hidden";
}

window.dailyTaskView = { open, close, isOpen };

})();

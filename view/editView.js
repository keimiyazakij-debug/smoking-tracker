(function () {
// view/editView.js

// DOMの書き換え
document.getElementById("addTimeTagBtn").addEventListener("click", () => {
    window.editController.addTimeTag();
});

document.getElementById("saveEditBtn").addEventListener("click", () => {
    window.editController.saveEdit();
});

document.getElementById("closeEditBtn").addEventListener("click", () => {
    window.editController.closeEdit();
});


function open(state) {
  document.getElementById("editOverlay").classList.remove("hidden");
  document.getElementById("editTitle").textContent =
    `${state.dateKey} を修正`;

  document.getElementById("editDate").value = state.dateKey;
  render(state);
}

function close() {
  document.getElementById("editOverlay").classList.add("hidden");
  document.getElementById("timeTags").innerHTML = "";
}

function render(state) {
  const container = document.getElementById("timeTags");
  container.innerHTML = "";

  state.times.forEach((time, index) => {
    const tag = document.createElement("div");
    tag.className = "time-tag";

    const input = document.createElement("input");
    input.type = "time";
    input.value = time;
    input.oninput = () =>
      editController.updateTime(index, input.value);

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.onclick = () =>
      editController.removeTime(index);

    tag.appendChild(input);
    tag.appendChild(del);
    container.appendChild(tag);
  });
}

window.editView = { open, close, render };

})();
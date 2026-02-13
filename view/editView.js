(function () {
// view/editView.js
const EDIT_LOCK_MESSAGE = "60日より前のデータはプレミアム版で編集できます";

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

const dateInputEl = document.getElementById("editDateInput");
if (dateInputEl) {
  dateInputEl.addEventListener("input", () => {
    updateDateLockState();
  });
  dateInputEl.addEventListener("change", () => {
    updateDateLockState();
  });
}

function isLockedDate(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

function updateDateLockState() {
  const dateInput = document.getElementById("editDateInput");
  const saveBtn = document.getElementById("saveEditBtn");
  const notice = document.getElementById("editDateLockNotice");
  if (!dateInput || !saveBtn) return;

  const locked = isLockedDate(dateInput.value);
  saveBtn.disabled = locked;
  if (notice) {
    notice.textContent = locked ? EDIT_LOCK_MESSAGE : "";
  }
}

function open(state) {
  document.getElementById("editOverlay").classList.remove("hidden");
  document.getElementById("editTitle").textContent = state.title;

  const dateInput = document.getElementById("editDateInput");
  dateInput.value = state.dateKey;
  dateInput.disabled = false;
  dateInput.classList.remove("is-disabled");
  updateDateLockState();
  render(state);
}

function close() {
  document.getElementById("editOverlay").classList.add("hidden");
  document.getElementById("timeTags").innerHTML = "";
  const saveBtn = document.getElementById("saveEditBtn");
  const notice = document.getElementById("editDateLockNotice");
  if (saveBtn) saveBtn.disabled = false;
  if (notice) notice.textContent = "";
}

function isOpen() {
  const overlay = document.getElementById("editOverlay");
  return overlay && !overlay.classList.contains("hidden");
}

function getEditedDate() {
  const dateInput = document.getElementById("editDateInput");
  return dateInput ? dateInput.value : null;
}

function render(state) {
  const container = document.getElementById("timeTags");
  container.innerHTML = "";

  if (state.times.length === 0) {
    const empty = document.createElement("div");
    empty.className = "time-empty";
    empty.textContent = "時刻がありません";
    container.appendChild(empty);
    return;
  }

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
    del.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      editController.removeTime(index);
    };
    tag.appendChild(input);
    tag.appendChild(del);
    container.appendChild(tag);
  });
}

window.editView = { open, close, render, isOpen, getEditedDate };

})();

(function () {

// controller/editController.js

let currentDateKey;
let returnToMainOnSave = false;

function openEdit(dateKey, options = {}) {
  currentDateKey=dateKey;
  returnToMainOnSave = !!options.returnToMainOnSave;
  editModel.open(dateKey);
  editView.open(buildEditViewState());
}

function closeEdit() {
  window.editModel.close();
  window.editView.close();
  returnToMainOnSave = false;
}

function addTimeTag() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,"0");
  const mm = now.getMinutes().toString().padStart(2,"0");

  window.editModel.addTime(`${hh}:${mm}`);
  window.editView.render(buildEditViewState());
}

function updateTime(index, value) {
  window.editModel.updateTime(index, value);
}

function removeTime(index) {
  window.editModel.removeTime(index);
  window.editView.render(buildEditViewState());
}

function saveEdit() {
  window.editModel.save();
  const shouldReturnToMain = returnToMainOnSave;
  closeEdit();
  if (shouldReturnToMain) {
    if (window.timelineController?.closeTimeline) {
      window.timelineController.closeTimeline();
    }
    if (typeof window.showTab === "function") {
      window.showTab("main");
    }
  }
  onLogChanged(currentDateKey);
  window.messageController.enqueue({ type: "msg", text: "修正しました", priority: -1});
}

function refreshFromStorage() {
  if (!currentDateKey) return;
  window.editModel.open(currentDateKey);
  window.editView.render(buildEditViewState());
}

function isOpenEdit() {
  return window.editView.isOpen && window.editView.isOpen();
}

function buildEditViewState() {
  const state = window.editModel.getState();
  return {
    dateKey: state.dateKey,
    title: `${state.dateKey} を修正`,
    times: [...state.times]
  };
}

window.editController = {
  openEdit,
  closeEdit,
  addTimeTag,
  updateTime,
  removeTime,
  saveEdit,
  refreshFromStorage,
  isOpenEdit
};

})();

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
  // キャンセル時は編集前の日付に戻す
  const originalDateKey = currentDateKey;
  window.editModel.close();
  window.editView.close();
  returnToMainOnSave = false;
  if (originalDateKey && window.timelineController?.openTimeline) {
    window.timelineController.openTimeline(originalDateKey);
  } else if (typeof window.showTab === "function") {
    window.showTab("timeline");
  }
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
  // 保存後遷移: 編集画面の入力日付（変更後）を優先
  const editedDate = window.editView?.getEditedDate
    ? window.editView.getEditedDate()
    : currentDateKey;
  window.editModel.save();
  const targetDateKey = editedDate || currentDateKey;

  // 保存ロジックは維持し、保存後の遷移のみ変更
  window.editModel.close();
  window.editView.close();
  returnToMainOnSave = false;
  currentDateKey = targetDateKey;
  if (window.timelineController?.openTimeline) {
    window.timelineController.openTimeline(targetDateKey);
  } else if (typeof window.showTab === "function") {
    window.showTab("timeline");
  }

  if (typeof window.onLogChanged === "function") {
    window.onLogChanged(targetDateKey);
  }
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
    title: "記録を編集",
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

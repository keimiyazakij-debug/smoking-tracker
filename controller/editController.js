(function () {

// controller/editController.js

let currentDateKey;

function openEdit(dateKey) {
  currentDateKey=dateKey;
  editModel.open(dateKey);
  editView.open(window.editModel.getState());
}

function closeEdit() {
  window.editModel.close();
  window.editView.close();
}

function addTimeTag() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,"0");
  const mm = now.getMinutes().toString().padStart(2,"0");

  window.editModel.addTime(`${hh}:${mm}`);
  window.editView.render(window.editModel.getState());
}

function updateTime(index, value) {
  window.editModel.updateTime(index, value);
}

function removeTime(index) {
  window.editModel.removeTime(index);
  window.editView.render(window.editModel.getState());
}

function saveEdit() {
  window.editModel.save();
  closeEdit();
  onLogChanged(currentDateKey);
  window.messageController.enqueue({ type: "msg", text: "修正しました"});
}

window.editController = {
  openEdit,
  closeEdit,
  addTimeTag,
  updateTime,
  removeTime,
  saveEdit
};

})();
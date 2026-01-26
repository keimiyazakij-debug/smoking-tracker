(function () {

// controller/editController.js

let currentDateKey;

function openEdit(dateKey) {
  currentDateKey=dateKey;
  editModel.open(dateKey);
  editView.open(editModel.getState());
}

function closeEdit() {
  editModel.close();
  editView.close();
}

function addTimeTag() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,"0");
  const mm = now.getMinutes().toString().padStart(2,"0");

  editModel.addTime(`${hh}:${mm}`);
  editView.render(editModel.getState());
}

function updateTime(index, value) {
  editModel.updateTime(index, value);
}

function removeTime(index) {
  editModel.removeTime(index);
  editView.render(editModel.getState());
}

function saveEdit() {
  editModel.save();
  closeEdit();
  onLogChanged(currentDateKey);
  messageController.enqueue({ type: "msg", text: "修正しました"});
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
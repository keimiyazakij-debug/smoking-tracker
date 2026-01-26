(function () {
const messageArea = document.getElementById("message");

function showMessageWithAutoClose(text, onClose) {
  const m = document.getElementById("message");
  m.textContent = text;

  setTimeout(() => {
    m.textContent = "";
    onClose();
  }, 3000);
}

function hideMessage() {
  messageArea.classList.remove("is-visible");
  void messageArea.offsetHeight; // Safari再描画トリガ
}

window.messageView = {
  showMessageWithAutoClose,
  hideMessage
};

})();
(function () {
const messageArea = document.getElementById("message");

function showMessageWithAutoClose(text, onClose, durationMs = 3000) {
  const m = document.getElementById("message");
  m.textContent = text;

  setTimeout(() => {
    m.textContent = "";
    onClose();
  }, durationMs);
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

(function () {

function showMessageWithAutoClose(text, onClose) {
  const m = document.getElementById("message");
  m.textContent = text;

  setTimeout(() => {
    m.textContent = "";
    onClose();
  }, 3000);
}

window.messageView = {
  showMessageWithAutoClose
};

})();
(function () {
let toastTimer = null;

function getToastEl() {
  let el = document.getElementById("appToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "appToast";
    el.className = "app-toast";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(text, durationMs = 1200) {
  if (!text) return;
  const toast = getToastEl();
  toast.textContent = text;
  toast.classList.add("is-visible");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, durationMs);
}

function addMessage(text) {
  showToast(text, 1200);
}

function clearAll() {
  const toast = document.getElementById("appToast");
  if (toast) {
    toast.textContent = "";
    toast.classList.remove("is-visible");
  }
}

function showMessageWithAutoClose(text, onClose, durationMs = 1200) {
  showToast(text, durationMs);
  if (typeof onClose === "function") {
    window.setTimeout(onClose, durationMs);
  }
}

function hideMessage() {
  const toast = document.getElementById("appToast");
  if (!toast) return;
  toast.classList.remove("is-visible");
}

window.messageView = {
  addMessage,
  clearAll,
  showMessageWithAutoClose,
  hideMessage
};

})();

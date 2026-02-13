(function () {
let toastTimer = null;
const TOAST_DURATION_MS = 3000;

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

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Design System v1.0: UNDO を強調表示
function renderToastText(text) {
  const safe = escapeHtml(text);
  return safe.replace(/\bUNDO\b/g, '<span class="toast-undo">UNDO</span>');
}

function showToast(text, durationMs = TOAST_DURATION_MS) {
  if (!text) return;
  const toast = getToastEl();
  toast.innerHTML = renderToastText(text);
  toast.onclick = null;
  toast.classList.add("is-visible");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, durationMs);
}

function addMessage(payload) {
  if (!payload) return;
  if (typeof payload === "string") {
    showToast(payload, TOAST_DURATION_MS);
    return;
  }

  const text = payload.text;
  if (!text) return;
  const toast = getToastEl();
  const actionLabel = payload.actionLabel ? escapeHtml(payload.actionLabel) : "";
  const body = renderToastText(text);
  toast.innerHTML = actionLabel
    ? `${body} <button type="button" class="toast-action">${actionLabel}</button>`
    : body;
  toast.classList.add("is-visible");

  const actionBtn = toast.querySelector(".toast-action");
  if (actionBtn && typeof payload.onAction === "function") {
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      payload.onAction();
      toast.classList.remove("is-visible");
    }, { once: true });
  }

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, TOAST_DURATION_MS);
}

function clearAll() {
  const toast = document.getElementById("appToast");
  if (toast) {
    toast.textContent = "";
    toast.classList.remove("is-visible");
  }
}

function showMessageWithAutoClose(text, onClose, durationMs = TOAST_DURATION_MS) {
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

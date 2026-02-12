(function () {
const messageArea = document.getElementById("message");
const MAX_LINES = 3;
let toastTimer = null;
let autoCloseTimer = null;

function getToastEl() {
  let el = document.getElementById("calendarToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "calendarToast";
    el.className = "calendar-toast";
    document.body.appendChild(el);
  }
  return el;
}

function isCalendarVisible() {
  const cal = document.getElementById("calendar");
  if (!cal) return false;
  return getComputedStyle(cal).display !== "none";
}

function formatTime(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function addMessage(text) {
  if (!messageArea) return;
  if (!text) return;
  if (isCalendarVisible()) {
    const toast = getToastEl();
    toast.textContent = text;
    toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3000);
    return;
  }

  const line = document.createElement("div");
  line.className = "message-line";

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatTime(new Date());

  const body = document.createElement("span");
  body.className = "message-text";
  body.textContent = text;

  line.appendChild(time);
  line.appendChild(body);
  messageArea.appendChild(line);

  while (messageArea.children.length > MAX_LINES) {
    messageArea.removeChild(messageArea.firstChild);
  }

  if (window.updateLayoutHeights) {
    window.updateLayoutHeights();
  }
}

function clearAll() {
  if (!messageArea) return;
  messageArea.textContent = "";
  if (window.updateLayoutHeights) {
    window.updateLayoutHeights();
  }
}

function showMessageWithAutoClose(text, onClose, durationMs = 3000) {
  if (!messageArea) return;
  if (!text) return;
  messageArea.textContent = text;
  messageArea.classList.add("is-visible");
  if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
  autoCloseTimer = window.setTimeout(() => {
    messageArea.textContent = "";
    messageArea.classList.remove("is-visible");
    if (typeof onClose === "function") onClose();
  }, durationMs);
}

function hideMessage() {
  if (!messageArea) return;
  messageArea.classList.remove("is-visible");
}

window.messageView = {
  addMessage,
  clearAll,
  showMessageWithAutoClose,
  hideMessage
};

})();

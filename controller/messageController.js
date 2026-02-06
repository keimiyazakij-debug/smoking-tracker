(function () {

// controller/messageController.js
let queue = [];
let showing = false;
let shortToken = 0;

const LONG_DURATION_MS = 3000;
const SHORT_DURATION_MS = 1200;
const TTL_MS = {
  badge: 15000,
  daily: 15000,
  msg: 2000
};

function enqueue(...events) {
  const now = Date.now();
  events.flat().forEach(event => {
    if (!event) return;
    const ttl = event.ttlMs ?? TTL_MS[event.type] ?? 5000;
    const e = {
      ...event,
      priority: event.priority ?? 0,
      createdAt: event.createdAt ?? now,
      ttlMs: ttl
    };

    // priority < 0 は「短期・即時表示」
    if (e.priority < 0) {
      if (now - e.createdAt <= e.ttlMs) {
        showShort(e);
      }
    } else {
      queue.push(e);
    }
  });
  tryShow();
}

function tryShow() {
  if (showing) return;
  const now = Date.now();
  while (queue.length > 0) {
    const event = queue.shift();
    if (!event) continue;
    if (now - event.createdAt <= event.ttlMs) {
      showLong(event);
      return;
    }
  }
}

function showLong(event) {
  showing = true;
  const text = buildMessageText(event);

  // ★ 追加：表示前に必ずリセット（Safari対策）
  window.messageView.hideMessage();  

  window.messageView.showMessageWithAutoClose(text, () => {
    // ★ 追加：非表示を明示
    window.messageView.hideMessage();
    showing = false;
    tryShow();
  }, LONG_DURATION_MS);
}

function showShort(event) {
  const text = buildMessageText(event);
  const token = ++shortToken;
  window.messageView.showMessageWithAutoClose(text, () => {
    if (token !== shortToken) return;
  }, SHORT_DURATION_MS);
}

function showMessage(text) {
  window.messageView.showMessageWithAutoClose(text, () => {}, LONG_DURATION_MS);
}

function buildMessageText(event) {
  if (!event) return "";

  switch (event.type) {
    case "badge":
      return `🎉 バッジ獲得：${event.label}`;
    case "daily":
      return `✅ 今日のチャレンジ達成`;
    case "msg":
      return event.text;
    default:
      return "";
  }
}

window.buildMessageText = buildMessageText;
window.messageController = { 
  enqueue,
  showMessage
 };

 })();

(function () {

// controller/messageController.js
let queue = [];
let showing = false;

function enqueue(...events) {
  queue.push(...events.flat());
  tryShow();
}

function tryShow() {
  if (showing) return;
  const event = queue.shift();
  if (!event) return;

  showing = true;
  const text = buildMessageText(event);

  // ★ 追加：表示前に必ずリセット（Safari対策）
  window.messageView.hideMessage();  

  window.messageView.showMessageWithAutoClose(text, () => {
    // ★ 追加：非表示を明示
    window.messageView.hideMessage();
    showing = false;
    tryShow();
  });
}

function showMessage(text) {
  window.messageView.showMessageWithAutoClose(text, () => {});
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
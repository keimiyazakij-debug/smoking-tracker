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

  window.messageView.showMessageWithAutoClose(text, () => {
    showing = false;
    tryShow();
  });
}

function tryShowNextMessage() {
  if (showing) return;
  if (queue.length === 0) return;

  const next = queue.shift();
  showMessage(next);
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
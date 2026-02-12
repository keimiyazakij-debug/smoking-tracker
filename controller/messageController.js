(function () {

// controller/messageController.js
function enqueue(...events) {
  events.flat().forEach(event => {
    if (!event) return;
    if (event.ttlMs && event.createdAt) {
      if (Date.now() - event.createdAt > event.ttlMs) return;
    }
    const text = buildMessageText(event);
    if (!text) return;
    if (window.messageView?.addMessage) {
      window.messageView.addMessage(text);
    } else if (window.messageView?.showMessageWithAutoClose) {
      window.messageView.showMessageWithAutoClose(text, () => {});
    }
  });
}

function showMessage(text) {
  if (!text) return;
  if (window.messageView?.addMessage) {
    window.messageView.addMessage(text);
  } else if (window.messageView?.showMessageWithAutoClose) {
    window.messageView.showMessageWithAutoClose(text, () => {});
  }
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

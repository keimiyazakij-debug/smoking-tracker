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
    const payload = buildMessagePayload(event, text);
    if (publishInlineMessage(text, event)) return;
    if (window.messageView?.addMessage) {
      window.messageView.addMessage(payload);
    } else if (window.messageView?.showMessageWithAutoClose) {
      window.messageView.showMessageWithAutoClose(text, () => {});
    }
  });
}

function buildMessagePayload(event, text) {
  if (!event) return text;
  if (event.type === "premium_lock") {
    return {
      text,
      actionLabel: "詳細を見る",
      onAction: () => {
        if (typeof window.navigateTo === "function") {
          window.navigateTo("PremiumView");
        }
      }
    };
  }
  if (event.type === "msg" && event.toastPosition === "top") {
    return {
      text,
      position: "top"
    };
  }
  return text;
}

function showMessage(text) {
  if (!text) return;
  if (publishInlineMessage(text)) return;
  if (window.messageView?.addMessage) {
    window.messageView.addMessage(text);
  } else if (window.messageView?.showMessageWithAutoClose) {
    window.messageView.showMessageWithAutoClose(text, () => {});
  }
}

function publishInlineMessage(text, event = null) {
  if (!text) return false;
  if (event?.forceToast === true) return false;
  if (!window.calendarController?.setInlineMessage) return false;
  window.calendarController.setInlineMessage(text);
  return true;
}

function buildMessageText(event) {
  if (!event) return "";

  switch (event.type) {
    case "badge":
      return `🎉 バッジ獲得：${event.label}`;
    case "daily":
      return `✅ 今日のチャレンジ達成`;
    case "msg":
    case "premium_lock":
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

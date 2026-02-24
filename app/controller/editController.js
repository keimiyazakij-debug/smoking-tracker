(function () {

// controller/editController.js

let currentDateKey;

function openEdit(dateKey, options = {}) {
  const locked = window.common?.isDateLocked
    ? window.common.isDateLocked(dateKey)
    : false;
  // 無料版60日ロック: 編集入口でブロック
  if (locked) {
    if (window.messageController?.enqueue) {
      window.messageController.enqueue({
        // プレミアム導線: ロックトーストに「詳細を見る」を表示
        type: "premium_lock",
        text: "60日より前のデータはプレミアム版で閲覧できます。",
        priority: -1
      });
    }
    if (window.timelineController?.openTimeline) {
      window.timelineController.openTimeline(dateKey);
    } else if (typeof window.showTab === "function") {
      window.showTab("timeline");
    }
    return;
  }
  currentDateKey=dateKey;
  editModel.open(dateKey, options);
  editView.open(buildEditViewState());
}

function closeEdit() {
  // キャンセル時は編集前の日付に戻す
  const originalDateKey = currentDateKey;
  window.editModel.close();
  window.editView.close();
  if (originalDateKey && window.timelineController?.openTimeline) {
    window.timelineController.openTimeline(originalDateKey);
  } else if (typeof window.showTab === "function") {
    window.showTab("timeline");
  }
}

function addTimeTag() {
  const state = window.editModel?.getState ? window.editModel.getState() : null;
  const now = new Date();
  const hasScopedHour = Number.isInteger(state?.scopeHour);
  const baseHour = hasScopedHour ? state.scopeHour : now.getHours();
  const hh = String(baseHour).padStart(2,"0");
  const mm = hasScopedHour ? "00" : now.getMinutes().toString().padStart(2,"0");

  window.editModel.addTime(`${hh}:${mm}`);
  window.editView.render(buildEditViewState());
}

function updateTime(index, value) {
  window.editModel.updateTime(index, value);
}

function removeTime(index) {
  window.editModel.removeTime(index);
  window.editView.render(buildEditViewState());
}

function saveEdit() {
  // 保存後遷移: 編集画面の入力日付（変更後）を優先
  const editedDate = window.editView?.getEditedDate
    ? window.editView.getEditedDate()
    : currentDateKey;
  const targetDateKey = editedDate || currentDateKey;
  const todayKey = window.common.getDateKey(new Date());
  if (targetDateKey > todayKey) {
    window.messageController.enqueue({
      type: "msg",
      text: "未来の日付は保存できません",
      priority: -1
    });
    return;
  }

  const state = window.editModel?.getState ? window.editModel.getState() : null;
  const validTimes = state && Array.isArray(state.times)
    ? state.times.filter((time) => typeof time === "string" && time.trim().length > 0)
    : [];
  if (validTimes.length === 0) {
    window.messageController.enqueue({
      type: "msg",
      text: "時刻を1件以上入力してください",
      priority: -1
    });
    return;
  }
  if (state && Array.isArray(state.times) && targetDateKey === todayKey) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const hasFutureTime = state.times.some((time) => {
      const [hhRaw, mmRaw] = String(time || "").split(":");
      const hh = Number.parseInt(hhRaw, 10);
      const mm = Number.parseInt(mmRaw, 10);
      if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
      return (hh * 60 + mm) > nowMinutes;
    });
    if (hasFutureTime) {
      window.messageController.enqueue({
        type: "msg",
        text: "未来の時刻は保存できません",
        priority: -1
      });
      return;
    }
  }

  const locked = window.common?.isDateLocked
    ? window.common.isDateLocked(targetDateKey)
    : false;
  if (locked) {
    window.messageController.enqueue({
      type: "premium_lock",
      text: "60日より前のデータはプレミアム版で編集できます",
      priority: -1
    });
    return;
  }
  if (window.editModel?.setDateKey) {
    window.editModel.setDateKey(targetDateKey);
  }
  const hasChanges = window.editModel?.hasChanges
    ? window.editModel.hasChanges(targetDateKey)
    : true;
  if (!hasChanges) {
    window.editModel.close();
    window.editView.close();
    currentDateKey = targetDateKey;
    if (window.timelineController?.openTimeline) {
      window.timelineController.openTimeline(targetDateKey);
    } else if (typeof window.showTab === "function") {
      window.showTab("timeline");
    }
    return;
  }
  window.editModel.save();

  // 保存ロジックは維持し、保存後の遷移のみ変更
  window.editModel.close();
  window.editView.close();
  currentDateKey = targetDateKey;
  if (window.timelineController?.openTimeline) {
    window.timelineController.openTimeline(targetDateKey);
  } else if (typeof window.showTab === "function") {
    window.showTab("timeline");
  }

  if (typeof window.onLogChanged === "function") {
    window.onLogChanged(targetDateKey);
  }
  window.messageController.enqueue({
    type: "msg",
    text: "修正しました",
    priority: -1,
    forceToast: true,
    toastPosition: "top"
  });
}

function refreshFromStorage() {
  if (!currentDateKey) return;
  const state = window.editModel?.getState ? window.editModel.getState() : null;
  const scopeHour = Number.isInteger(state?.scopeHour) ? state.scopeHour : null;
  const openOptions = Number.isInteger(scopeHour) ? { hour: scopeHour } : {};
  window.editModel.open(currentDateKey, openOptions);
  window.editView.render(buildEditViewState());
}

function isOpenEdit() {
  return window.editView.isOpen && window.editView.isOpen();
}

function buildEditViewState() {
  const state = window.editModel.getState();
  const hourLabel = Number.isInteger(state.scopeHour) ? `（${state.scopeHour}時台）` : "";
  return {
    dateKey: state.dateKey,
    title: `記録を編集${hourLabel}`,
    times: [...state.times]
  };
}

window.editController = {
  openEdit,
  closeEdit,
  addTimeTag,
  updateTime,
  removeTime,
  saveEdit,
  refreshFromStorage,
  isOpenEdit
};

})();

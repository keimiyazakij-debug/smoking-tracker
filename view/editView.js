(function () {
// view/editView.js
const EDIT_LOCK_MESSAGE = "60日より前のデータはプレミアム版で編集できます";
const EDIT_FUTURE_MESSAGE = "未来の日付・時刻は入力できません";
let lastRenderedState = null;

// DOMの書き換え
document.getElementById("addTimeTagBtn").addEventListener("click", () => {
    window.editController.addTimeTag();
});

document.getElementById("saveEditBtn").addEventListener("click", () => {
    window.editController.saveEdit();
});

document.getElementById("closeEditBtn").addEventListener("click", () => {
    window.editController.closeEdit();
});

const dateInputEl = document.getElementById("editDateInput");
if (dateInputEl) {
  dateInputEl.addEventListener("input", () => {
    updateDateLockState();
    rerenderForDateChange();
  });
  dateInputEl.addEventListener("change", () => {
    updateDateLockState();
    rerenderForDateChange();
  });
}

function parseTime(time) {
  const [hhRaw, mmRaw] = String(time || "").split(":");
  const hhNum = Number.parseInt(hhRaw, 10);
  const mmNum = Number.parseInt(mmRaw, 10);
  const hh = Number.isInteger(hhNum) && hhNum >= 0 && hhNum <= 23 ? hhNum : 0;
  const mm = Number.isInteger(mmNum) && mmNum >= 0 && mmNum <= 59 ? mmNum : 0;
  return {
    hh: String(hh).padStart(2, "0"),
    mm: String(mm).padStart(2, "0")
  };
}

function createTimeSelect(max, selectedValue) {
  const select = document.createElement("select");
  for (let i = 0; i <= max; i++) {
    const value = String(i).padStart(2, "0");
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  }
  return select;
}

function isLockedDate(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

function getTodayKey() {
  return window.common.getDateKey(new Date());
}

function getNowParts() {
  const now = new Date();
  return {
    hh: now.getHours(),
    mm: now.getMinutes()
  };
}

function isFutureDate(dateKey) {
  if (!dateKey) return false;
  return dateKey > getTodayKey();
}

function isFutureTimeForToday(time) {
  const [hhRaw, mmRaw] = String(time || "").split(":");
  const hh = Number.parseInt(hhRaw, 10);
  const mm = Number.parseInt(mmRaw, 10);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
  const now = getNowParts();
  return hh > now.hh || (hh === now.hh && mm > now.mm);
}

function clampTimeToNowIfNeeded(time, dateKey) {
  if (dateKey !== getTodayKey()) return time;
  if (!isFutureTimeForToday(time)) return time;
  const now = getNowParts();
  return `${String(now.hh).padStart(2, "0")}:${String(now.mm).padStart(2, "0")}`;
}

function hasFutureTimeInUi(dateKey) {
  if (dateKey !== getTodayKey()) return false;
  const rows = document.querySelectorAll(".time-tag");
  for (const row of rows) {
    const hourSelect = row.querySelector(".time-select-hour");
    const minuteSelect = row.querySelector(".time-select-minute");
    if (!hourSelect || !minuteSelect) continue;
    if (isFutureTimeForToday(`${hourSelect.value}:${minuteSelect.value}`)) {
      return true;
    }
  }
  return false;
}

function applyTimeLimit(row, dateKey) {
  const hourSelect = row.querySelector(".time-select-hour");
  const minuteSelect = row.querySelector(".time-select-minute");
  if (!hourSelect || !minuteSelect) return;

  const isToday = dateKey === getTodayKey();
  const now = getNowParts();

  Array.from(hourSelect.options).forEach((opt) => {
    const hour = Number.parseInt(opt.value, 10);
    opt.disabled = isToday && hour > now.hh;
  });

  if (isToday && Number.parseInt(hourSelect.value, 10) > now.hh) {
    hourSelect.value = String(now.hh).padStart(2, "0");
  }

  Array.from(minuteSelect.options).forEach((opt) => {
    const minute = Number.parseInt(opt.value, 10);
    const selectedHour = Number.parseInt(hourSelect.value, 10);
    opt.disabled = isToday && selectedHour === now.hh && minute > now.mm;
  });

  if (isToday) {
    const selectedHour = Number.parseInt(hourSelect.value, 10);
    const selectedMinute = Number.parseInt(minuteSelect.value, 10);
    if (selectedHour === now.hh && selectedMinute > now.mm) {
      minuteSelect.value = String(now.mm).padStart(2, "0");
    }
  }
}

function rerenderForDateChange() {
  if (!lastRenderedState) return;
  render(lastRenderedState);
}

function updateDateLockState() {
  const dateInput = document.getElementById("editDateInput");
  const saveBtn = document.getElementById("saveEditBtn");
  const notice = document.getElementById("editDateLockNotice");
  if (!dateInput || !saveBtn) return;

  const locked = isLockedDate(dateInput.value);
  const futureDate = isFutureDate(dateInput.value);
  const futureTime = hasFutureTimeInUi(dateInput.value);
  saveBtn.disabled = locked || futureDate || futureTime;
  if (notice) {
    if (locked) {
      notice.textContent = EDIT_LOCK_MESSAGE;
    } else if (futureDate || futureTime) {
      notice.textContent = EDIT_FUTURE_MESSAGE;
    } else {
      notice.textContent = "";
    }
  }
}

function open(state) {
  document.getElementById("editOverlay").classList.remove("hidden");
  document.getElementById("editTitle").textContent = state.title;

  const dateInput = document.getElementById("editDateInput");
  dateInput.max = getTodayKey();
  dateInput.value = state.dateKey;
  dateInput.disabled = false;
  dateInput.classList.remove("is-disabled");
  updateDateLockState();
  render(state);
}

function close() {
  document.getElementById("editOverlay").classList.add("hidden");
  document.getElementById("timeTags").innerHTML = "";
  lastRenderedState = null;
  const saveBtn = document.getElementById("saveEditBtn");
  const notice = document.getElementById("editDateLockNotice");
  if (saveBtn) saveBtn.disabled = false;
  if (notice) notice.textContent = "";
}

function isOpen() {
  const overlay = document.getElementById("editOverlay");
  return overlay && !overlay.classList.contains("hidden");
}

function getEditedDate() {
  const dateInput = document.getElementById("editDateInput");
  return dateInput ? dateInput.value : null;
}

function render(state) {
  lastRenderedState = {
    ...state,
    times: [...state.times]
  };
  const container = document.getElementById("timeTags");
  const dateInput = document.getElementById("editDateInput");
  const currentDateKey = dateInput ? dateInput.value : state.dateKey;
  container.innerHTML = "";

  if (state.times.length === 0) {
    const empty = document.createElement("div");
    empty.className = "time-empty";
    empty.textContent = "時刻がありません";
    container.appendChild(empty);
    updateDateLockState();
    return;
  }

  state.times.forEach((time, index) => {
    const tag = document.createElement("div");
    tag.className = "time-tag";
    const parsed = parseTime(time);
    const timeWrap = document.createElement("div");
    timeWrap.className = "time-select-wrap";
    const clamped = clampTimeToNowIfNeeded(`${parsed.hh}:${parsed.mm}`, currentDateKey);
    const [hh, mm] = clamped.split(":");
    const hourSelect = createTimeSelect(23, hh);
    const minuteSelect = createTimeSelect(59, mm);
    hourSelect.className = "time-select";
    minuteSelect.className = "time-select";
    hourSelect.classList.add("time-select-hour");
    minuteSelect.classList.add("time-select-minute");
    const sep = document.createElement("span");
    sep.className = "time-separator";
    sep.textContent = ":";

    const updateSelectedTime = () => {
      applyTimeLimit(tag, currentDateKey);
      const nextValue = `${hourSelect.value}:${minuteSelect.value}`;
      editController.updateTime(index, nextValue);
      if (lastRenderedState && Array.isArray(lastRenderedState.times)) {
        lastRenderedState.times[index] = nextValue;
      }
      updateDateLockState();
    };
    hourSelect.addEventListener("change", updateSelectedTime);
    minuteSelect.addEventListener("change", updateSelectedTime);
    timeWrap.appendChild(hourSelect);
    timeWrap.appendChild(sep);
    timeWrap.appendChild(minuteSelect);

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "✕";
    del.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      editController.removeTime(index);
    };
    tag.appendChild(timeWrap);
    tag.appendChild(del);
    container.appendChild(tag);
    applyTimeLimit(tag, currentDateKey);
    updateSelectedTime();
  });

  updateDateLockState();
}

window.editView = { open, close, render, isOpen, getEditedDate };

})();

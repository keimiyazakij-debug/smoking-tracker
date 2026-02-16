(function () {

// controller/calendarController.js
let selectedDateKey = null;
const CALENDAR_VIEW_STATE_KEY = "calendarViewState";
const MEMO_SAVE_DEBOUNCE_MS = 500;
const INLINE_MESSAGE_TTL_MS = 3000;
const HOLIDAY_CACHE_PREFIX = "holidays_";
const HOLIDAY_API_BASE = "https://date.nager.at/api/v3/PublicHolidays";

let memoExpandedDateKey = null;
let memoEditingDateKey = null;
let memoSaveTimer = null;
let memoSavePending = null;
let transientInlineMessageText = "";
let transientInlineMessageTimer = null;
let lastCalendarData = {};
let lastTodayKey = null;
const holidayStore = {};
const holidayFetchPromises = {};

function isLockedDate(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

function renderCalendar() {
  if (window.dailyDataModel?.syncCountsFromLogs) {
    window.dailyDataModel.syncCountsFromLogs();
  }

  const state = window.calendarModel.buildCalendarState();
  lastTodayKey = state.todayKey || null;
  const holidays = getHolidaysForYear(state.year);
  ensureHolidaysLoaded(state.year);
  const dailyData = window.dailyDataModel?.loadDailyData
    ? window.dailyDataModel.loadDailyData()
    : {};
  const logsForCalendar = Object.keys(state.logs || {}).map((dateKey) => {
    const times = Array.isArray(state.logs[dateKey]) ? state.logs[dateKey] : [];
    return {
      date: dateKey,
      count: times.length,
      status: window.common.getDayStatus(dateKey, state.logs)
    };
  });

  const calendarData =
    window.calendarModel.buildCalendarData(
      logsForCalendar,
      state.todayKey,
      dailyData
    );
  lastCalendarData = calendarData;

  const days = buildCalendarDays(state, calendarData, holidays);
  if (!selectedDateKey) {
    const today = window.common.parseDateKey(state.todayKey);
    if (today.getFullYear() === state.year && today.getMonth() === state.month) {
      selectedDateKey = state.todayKey;
    } else {
      selectedDateKey = `${state.year}-${String(state.month + 1).padStart(2, "0")}-01`;
    }
  }

  window.calendarView.render({
    ...state,
    calendarData,
    days,
    selectedDateKey
  });

  renderDayDetail(calendarData);
}

function showCalendar() {
  restoreViewState();
  if (!selectedDateKey) {
    selectedDateKey = window.common.getDateKey(new Date());
  }
  renderCalendar();
}

function prevMonth() {
  flushMemoSave();
  window.calendarModel.prevMonth();
  selectedDateKey = null;
  memoEditingDateKey = null;
  memoExpandedDateKey = null;
  renderCalendar();
  saveViewState();
}

function nextMonth() {
  flushMemoSave();
  window.calendarModel.nextMonth();
  selectedDateKey = null;
  memoEditingDateKey = null;
  memoExpandedDateKey = null;
  renderCalendar();
  saveViewState();
}

function refresh() {
  if (memoEditingDateKey) return;
  renderCalendar();
}

function buildCalendarDays(state, calendarData, holidays = []) {
  const days = [];
  const holidayMap = buildHolidayMap(holidays);

  for (let d = 1; d <= state.lastDate; d++) {
    const dateKey = `${state.year}-${String(state.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayData = calendarData[dateKey];
    const count = Number.isInteger(dayData?.count) ? dayData.count : null;
    const status = typeof dayData?.status === "string"
      ? dayData.status
      : "unrecorded";
    const holidayName = holidayMap[dateKey] || "";

    days.push({
      day: d,
      dateKey,
      count,
      status,
      isHoliday: isHoliday(dateKey, holidays),
      holidayName,
      // 無料版60日ロック判定（共通ロジック）
      isLocked: isLockedDate(dateKey),
      hasLog: status === "smoke",
      hasMemo: typeof dayData?.memo === "string" &&
        dayData.memo.trim().length > 0
    });
  }

  return days;
}

function getHolidayCacheKey(year) {
  return `${HOLIDAY_CACHE_PREFIX}${year}`;
}

function getHolidaysForYear(year) {
  if (Array.isArray(holidayStore[year])) return holidayStore[year];
  const key = getHolidayCacheKey(year);
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeHolidays(parsed);
    holidayStore[year] = normalized;
    return normalized;
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function buildHolidayMap(holidays) {
  return (holidays || []).reduce((acc, item) => {
    if (!item?.date) return acc;
    acc[item.date] = item.localName || item.name || "";
    return acc;
  }, {});
}

function ensureHolidaysLoaded(year) {
  if (Array.isArray(holidayStore[year])) return;
  fetchHolidays(year).then((holidays) => {
    holidayStore[year] = holidays;
    if (holidays.length === 0) return;
    if (window.calendarModel?.state?.year !== year) return;
    renderCalendar();
  });
}

async function fetchHolidays(year) {
  if (!Number.isInteger(year)) return [];
  if (Array.isArray(holidayStore[year])) return holidayStore[year];
  if (holidayFetchPromises[year]) return holidayFetchPromises[year];

  const key = getHolidayCacheKey(year);
  const cached = getHolidaysForYear(year);
  if (cached.length > 0) return cached;

  const promise = (async () => {
    try {
      // jsdom / テスト環境では外部 API を叩かない
      if (typeof window.fetch !== "function" || window.location?.protocol === "about:") {
        return [];
      }
      const response = await window.fetch(`${HOLIDAY_API_BASE}/${year}/JP`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`holiday api error: ${response.status}`);
      }
      const data = await response.json();
      const normalized = normalizeHolidays(data);
      localStorage.setItem(key, JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.error("Failed to load holidays:", error);
      return [];
    } finally {
      delete holidayFetchPromises[year];
    }
  })();

  holidayFetchPromises[year] = promise;
  return promise;
}

function normalizeHolidays(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => typeof item?.date === "string")
    .map((item) => ({
      date: item.date,
      localName: typeof item.localName === "string" ? item.localName : "",
      name: typeof item.name === "string" ? item.name : ""
    }));
}

function isHoliday(date, holidays) {
  if (!date || !Array.isArray(holidays)) return false;
  const dateKey = typeof date === "string" ? date : window.common.getDateKey(date);
  return holidays.some((holiday) => holiday?.date === dateKey);
}

function onDayClick(dateKey) {
  if (isLockedDate(dateKey)) {
    if (window.messageController?.enqueue) {
      window.messageController.enqueue({
        type: "premium_lock",
        text: "60日より前のデータはプレミアム版で閲覧できます。",
        priority: -1
      });
    }
    return;
  }
  selectedDateKey = dateKey;
  memoEditingDateKey = null;
  memoExpandedDateKey = null;
  flushMemoSave();
  renderCalendar();
  saveViewState();
}

function getSelectedDateKey() {
  return selectedDateKey;
}

function renderDayDetail(calendarData) {
  const container = document.getElementById("calendarDetail");
  if (!container) return;
  if (!selectedDateKey) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const selected = calendarData[selectedDateKey] || { count: null, status: "unrecorded", memo: "" };
  const memo = typeof selected.memo === "string" ? selected.memo : "";
  const hasMemo = memo.trim().length > 0;
  const isEditing = memoEditingDateKey === selectedDateKey;
  const isExpanded = memoExpandedDateKey === selectedDateKey;
  const baseStatus = getPastDayStatus(selectedDateKey, calendarData);
  const status = baseStatus || buildTransientStatus();

  container.hidden = false;
  container.innerHTML = "";

  const linkWrap = document.createElement("div");
  linkWrap.className = "calendar-detail-link-wrap";
  const linkBtn = document.createElement("button");
  linkBtn.type = "button";
  linkBtn.className = "calendar-detail-link-btn";
  linkBtn.textContent = "この日の記録を見る";
  linkBtn.addEventListener("click", () => {
    saveViewState();
    window.timelineController.openTimeline(selectedDateKey, {
      from: "calendar",
      sourceDateKey: selectedDateKey,
      updateHistory: true
    });
  });
  linkWrap.appendChild(linkBtn);

  if (shouldShowConfirmSuccessButton(selectedDateKey)) {
    const successBtn = document.createElement("button");
    successBtn.type = "button";
    successBtn.className = "calendar-detail-success-btn";
    successBtn.textContent = "禁煙成功で確定";
    successBtn.addEventListener("click", () => {
      confirmSuccessForDate(selectedDateKey);
    });
    linkWrap.appendChild(successBtn);
  }
  container.appendChild(linkWrap);

  const card = document.createElement("article");
  card.className = "memo-card";
  container.appendChild(card);

  const statusLine = document.createElement("p");
  statusLine.className = "memo-status-line";
  applyStatusLine(statusLine, status);
  card.appendChild(statusLine);

  if (isEditing) {
    const textarea = document.createElement("textarea");
    textarea.className = "memo-editor";
    textarea.value = memo;
    textarea.placeholder = "この日のメモを入力";
    textarea.rows = 5;
    textarea.addEventListener("input", () => {
      queueMemoSave(selectedDateKey, textarea.value);
    });
    textarea.addEventListener("blur", () => {
      flushMemoSave();
      memoEditingDateKey = null;
      memoExpandedDateKey = null;
      renderCalendar();
      saveViewState();
    });
    card.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    return;
  }

  if (hasMemo) {
    const body = document.createElement("p");
    body.className = isExpanded ? "memo-text" : "memo-text memo-preview";
    body.textContent = memo;
    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "memo-actions";

    if (memo.split("\n").length > 3 || memo.length > 90) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "memo-toggle-btn";
      toggle.textContent = isExpanded ? "閉じる" : "もっと見る";
      toggle.addEventListener("click", () => {
        memoExpandedDateKey = isExpanded ? null : selectedDateKey;
        renderCalendar();
      });
      actions.appendChild(toggle);
    }

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "memo-edit-btn";
    editBtn.textContent = "編集する";
    editBtn.addEventListener("click", () => {
      memoEditingDateKey = selectedDateKey;
      clearMemoSaveTimer();
      renderCalendar();
    });
    actions.appendChild(editBtn);
    card.appendChild(actions);
    return;
  }

  const empty = document.createElement("p");
  empty.className = "memo-empty";
  empty.textContent = "メモはまだありません";
  card.appendChild(empty);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "memo-edit-btn";
  addBtn.textContent = "編集する";
  addBtn.addEventListener("click", () => {
    memoEditingDateKey = selectedDateKey;
    clearMemoSaveTimer();
    renderCalendar();
  });
  card.appendChild(addBtn);
}

function saveViewState() {
  const calendarTab = document.getElementById("calendar");
  const payload = {
    selectedDate: selectedDateKey,
    year: window.calendarModel.state.year,
    month: window.calendarModel.state.month,
    scrollTop: calendarTab ? calendarTab.scrollTop : 0
  };
  sessionStorage.setItem(CALENDAR_VIEW_STATE_KEY, JSON.stringify(payload));
  return payload;
}

function restoreViewState() {
  const raw = sessionStorage.getItem(CALENDAR_VIEW_STATE_KEY);
  if (!raw) {
    window.calendarModel.resetToToday();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Number.isInteger(parsed?.year) && Number.isInteger(parsed?.month)) {
      window.calendarModel.setMonth(parsed.year, parsed.month);
    }
    if (typeof parsed?.selectedDate === "string") {
      selectedDateKey = parsed.selectedDate;
    }

    window.setTimeout(() => {
      const calendarTab = document.getElementById("calendar");
      if (calendarTab && Number.isFinite(parsed?.scrollTop)) {
        calendarTab.scrollTop = parsed.scrollTop;
      }
    }, 0);
  } catch {
    window.calendarModel.resetToToday();
  }
}

function clearMemoSaveTimer() {
  if (!memoSaveTimer) return;
  window.clearTimeout(memoSaveTimer);
  memoSaveTimer = null;
}

function queueMemoSave(dateKey, memoValue) {
  memoSavePending = {
    dateKey,
    memoValue
  };
  clearMemoSaveTimer();
  memoSaveTimer = window.setTimeout(() => {
    persistPendingMemo();
  }, MEMO_SAVE_DEBOUNCE_MS);
}

function persistPendingMemo() {
  if (!memoSavePending) return;
  const { dateKey, memoValue } = memoSavePending;
  memoSavePending = null;
  memoSaveTimer = null;
  window.dailyDataModel?.upsertMemo?.(dateKey, memoValue);
}

function flushMemoSave() {
  clearMemoSaveTimer();
  persistPendingMemo();
}

function getPrevDateKey(dateKey) {
  const prev = window.common.parseDateKey(dateKey);
  prev.setDate(prev.getDate() - 1);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, "0");
  const d = String(prev.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayDeltaFromPrev(dateKey, calendarData) {
  const todayKey = resolveTodayKey();
  if (dateKey > todayKey) return null;
  if (!Object.prototype.hasOwnProperty.call(calendarData || {}, dateKey)) return null;

  const currentStatus = getCalendarDayStatus(dateKey, calendarData);
  if (currentStatus === "unrecorded") return null;
  const currentCount = Number(calendarData?.[dateKey]?.count ?? 0);
  const prevKey = getPrevDateKey(dateKey);
  if (!Object.prototype.hasOwnProperty.call(calendarData || {}, prevKey)) return null;
  const prevStatus = getCalendarDayStatus(prevKey, calendarData);
  if (prevStatus === "unrecorded") return null;
  const prevCount = Number(calendarData?.[prevKey]?.count ?? 0);
  if (!Number.isFinite(currentCount) || !Number.isFinite(prevCount)) return null;
  return prevCount - currentCount;
}

function getPastDayStatus(dateKey, calendarData) {
  const todayKey = resolveTodayKey();
  if (dateKey === todayKey) {
    return getTodayStatus(dateKey, calendarData);
  }
  if (dateKey > todayKey) return null;
  const dayStatus = getCalendarDayStatus(dateKey, calendarData);
  if (dayStatus === "unrecorded") return null;

  if (dayStatus === "success") {
    return {
      text: "🏆今日は禁煙達成です",
      tone: "blue"
    };
  }

  const dayDelta = getDayDeltaFromPrev(dateKey, calendarData);
  if (!Number.isFinite(dayDelta)) return null;

  if (dayDelta < 0) {
    return {
      text: `⚠前日より +${Math.abs(dayDelta)}本`,
      tone: "orange"
    };
  }

  if (dayDelta > 0) {
    const streak = getDecreaseStreak(dateKey, calendarData);
    if (streak >= 3) {
      return {
        text: "✨3日以上減少が継続",
        tone: "blue"
      };
    }
    if (streak >= 2) {
      return {
        text: "★二日連続で減少です",
        tone: "blue"
      };
    }
    return {
      text: `☆前日より -${dayDelta}本`,
      tone: "blue"
    };
  }

  return null;
}

function getTodayStatus(dateKey, calendarData) {
  const dayStatus = getCalendarDayStatus(dateKey, calendarData);
  if (dayStatus === "unrecorded") return null;
  const currentCount = Number(calendarData?.[dateKey]?.count ?? 0);
  if (!Number.isFinite(currentCount) || dayStatus === "success") return null;

  const dayDelta = getDayDeltaFromPrev(dateKey, calendarData);
  if (!Number.isFinite(dayDelta) || dayDelta === 0) return null;

  if (dayDelta < 0) {
    return {
      text: `⚠前日より +${Math.abs(dayDelta)}本`,
      tone: "orange"
    };
  }

  return {
    text: `☆前日より -${dayDelta}本`,
    tone: "blue"
  };
}

function getCalendarDayStatus(dateKey, calendarData) {
  if (!calendarData || !Object.prototype.hasOwnProperty.call(calendarData, dateKey)) {
    return "unrecorded";
  }
  const status = calendarData[dateKey]?.status;
  if (status === "smoke" || status === "success" || status === "unrecorded") {
    return status;
  }
  const count = calendarData[dateKey]?.count;
  if (count === null || count === undefined) return "unrecorded";
  if (count > 0) return "smoke";
  return "success";
}

function resolveTodayKey() {
  if (typeof lastTodayKey === "string" && lastTodayKey) return lastTodayKey;
  if (typeof window.appState?.todayKey === "string" && window.appState.todayKey) {
    return window.appState.todayKey;
  }
  return window.common.getDateKey(new Date());
}

function getDecreaseStreak(dateKey, calendarData) {
  let streak = 0;
  let cursor = dateKey;
  while (true) {
    const dayDelta = getDayDeltaFromPrev(cursor, calendarData);
    if (!Number.isFinite(dayDelta) || dayDelta <= 0) break;
    streak += 1;
    cursor = getPrevDateKey(cursor);
  }
  return streak;
}

function buildTransientStatus() {
  if (!transientInlineMessageText) return null;
  return {
    text: transientInlineMessageText,
    tone: "default"
  };
}

function applyStatusLine(statusLine, status) {
  if (!statusLine) return;
  statusLine.classList.remove("memo-status-line--orange", "memo-status-line--blue");
  if (!status?.text) {
    statusLine.textContent = " ";
    return;
  }
  statusLine.textContent = status.text;
  if (status.tone === "orange") {
    statusLine.classList.add("memo-status-line--orange");
  } else if (status.tone === "blue") {
    statusLine.classList.add("memo-status-line--blue");
  }
}

function setInlineMessage(text) {
  const normalizedText = typeof text === "string" ? text.trim() : "";
  if (!normalizedText) return;

  transientInlineMessageText = normalizedText;
  clearTransientInlineMessageTimer();
  transientInlineMessageTimer = window.setTimeout(() => {
    transientInlineMessageText = "";
    if (memoEditingDateKey) {
      syncStatusLineForEditingState();
      return;
    }
    renderCalendar();
  }, INLINE_MESSAGE_TTL_MS);

  if (memoEditingDateKey) {
    syncStatusLineForEditingState();
    return;
  }
  renderCalendar();
}

function clearTransientInlineMessageTimer() {
  if (!transientInlineMessageTimer) return;
  window.clearTimeout(transientInlineMessageTimer);
  transientInlineMessageTimer = null;
}

function syncStatusLineForEditingState() {
  const line = document.querySelector("#calendarDetail .memo-status-line");
  if (!line || !selectedDateKey) return;
  const baseStatus = getPastDayStatus(selectedDateKey, lastCalendarData);
  const status = baseStatus || buildTransientStatus();
  applyStatusLine(line, status);
}

function resetTransientInlineMessage() {
  transientInlineMessageText = "";
  clearTransientInlineMessageTimer();
}

function getStatusText(dateKey, calendarData) {
  const baseStatus = getPastDayStatus(dateKey, calendarData);
  if (baseStatus?.text) return baseStatus.text;
  return transientInlineMessageText || " ";
}

function clearInlineMessage() {
  resetTransientInlineMessage();
  if (memoEditingDateKey) {
    syncStatusLineForEditingState();
    return;
  }
  renderCalendar();
}

function shouldShowConfirmSuccessButton(dateKey) {
  if (!dateKey) return false;
  const logs = window.logModel?.getLogs ? window.logModel.getLogs() : {};
  const keys = Object.keys(logs || {}).sort();
  if (keys.length === 0) return false;
  const firstRecordedKey = keys[0];
  const todayKey = resolveTodayKey();
  const hasLogEntry = Object.prototype.hasOwnProperty.call(logs, dateKey);
  return !hasLogEntry && dateKey >= firstRecordedKey && dateKey <= todayKey;
}

function confirmSuccessForDate(dateKey) {
  if (!dateKey) return;
  const logs = window.logModel?.getLogs ? window.logModel.getLogs() : {};
  if (Object.prototype.hasOwnProperty.call(logs, dateKey)) return;
  logs[dateKey] = [];
  window.logModel?.setLogs?.(logs);
  if (typeof window.onLogChanged === "function") {
    window.onLogChanged(dateKey);
  } else {
    renderCalendar();
  }
}

window.calendarController = {
  showCalendar,
  prevMonth,
  nextMonth,
  onDayClick,
  getSelectedDateKey,
  refresh,
  saveViewState,
  restoreViewState,
  setInlineMessage,
  clearInlineMessage,
  confirmSuccessForDate,
  fetchHolidays,
  isHoliday
};

})();

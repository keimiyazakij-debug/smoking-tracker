(function () {

// controller/calendarController.js
// Design System v1.0: 選択日ハイライト用の状態（機能ロジックは変更しない）
let selectedDateKey = null;

function isLockedDate(dateKey) {
  if (!window.common?.isDateLocked) return false;
  return window.common.isDateLocked(dateKey);
}

function renderCalendar() {
  const state = window.calendarModel.buildCalendarState();
  const grouped = window.common.groupLogsByDate(state.logs);
  const logsForCalendar = grouped.map(d => ({
    date: d.date,
    count: d.smoke
  }));

  const calendarData =
    window.calendarModel.buildCalendarData(
      logsForCalendar,
      state.todayKey
    );

  const days = buildCalendarDays(state, calendarData);

  window.calendarView.render({
    ...state,
    calendarData,
    days,
    selectedDateKey
  });
}

function showCalendar() {
  window.calendarModel.resetToToday();
  selectedDateKey = null;
  renderCalendar();
}

function prevMonth() {
  window.calendarModel.prevMonth();
  renderCalendar();
}

function nextMonth() {
  window.calendarModel.nextMonth();
  renderCalendar();
}

function refresh() {
  renderCalendar();
}

function buildCalendarDays(state, calendarData) {
  let downStreak = 0;
  const days = [];

  for (let d = 1; d <= state.lastDate; d++) {
    const dateKey = `${state.year}-${String(state.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = calendarData[dateKey]?.count ?? null;
    const prev = calendarModel.getPrevDayInfo(dateKey, calendarData);
    const isPast = dateKey < state.todayKey;

    const evalType = calendarModel.evaluateDay({
      count,
      prevCount: prev?.count ?? null,
      target: state.target,
      isPast
    });

    if (evalType === "down") downStreak++;
    else if (evalType === "up") downStreak = 0;

    days.push({
      day: d,
      dateKey,
      count,
      // 無料版60日ロック判定（共通ロジック）
      isLocked: isLockedDate(dateKey),
      evalType,
      downStreak,
      prevCount: prev?.count ?? null,
      hasLog: Object.prototype.hasOwnProperty.call(calendarData, dateKey)
    });
  }

  return days;
}

function onDayClick(dateKey, hasLog) {
  if (isLockedDate(dateKey)) {
    if (window.messageController?.enqueue) {
      window.messageController.enqueue({
        // プレミアム導線: ロックトーストから詳細画面へ遷移可能にする
        type: "premium_lock",
        text: "60日より前のデータはプレミアム版で閲覧できます。",
        priority: -1
      });
    }
    return;
  }
  // 選択日の見た目だけ更新（既存遷移は維持）
  selectedDateKey = dateKey;
  renderCalendar();
  // UX改善: ログ有無に関係なく、カレンダーからは常にタイムラインを開く
  window.timelineController.openTimeline(dateKey);
}

window.calendarController = {
  showCalendar,
  prevMonth,
  nextMonth,
  onDayClick,
  refresh
};

})();

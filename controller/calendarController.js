(function () {

// controller/calendarController.js

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

  window.calendarView.render({
    ...state,
    calendarData
  });
}

function showCalendar() {
  window.calendarModel.resetToToday();
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

function onDayClick(dateKey, hasLog) {
  if (hasLog) {
    window.timelineController.openTimeline (dateKey);
  } else {
    window.editController.openEdit(dateKey);
  }
}

window.calendarController = {
  showCalendar,
  prevMonth,
  nextMonth,
  onDayClick,
  refresh
};

})();
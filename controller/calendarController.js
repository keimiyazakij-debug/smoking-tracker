(function () {

// controller/calendarController.js

function renderCalendar() {
  const state = window.calendarModel.buildCalendarState();

  const calendarData =
    window.calendarModel.buildCalendarData(
      state.logs,
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
  onDayClick
};

})();
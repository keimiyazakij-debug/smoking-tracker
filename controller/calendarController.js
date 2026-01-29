(function () {

// controller/calendarController.js

function showCalendar() {
  window.calendarModel.resetToToday();
  window.calendarView.render(window.calendarModel.buildCalendarData());
}

function prevMonth() {
  window.calendarModel.prevMonth();
  window.calendarView.render(window.calendarModel.buildCalendarData());
}

function nextMonth() {
  window.calendarModel.nextMonth();
  window.calendarView.render(window.calendarModel.buildCalendarData());
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
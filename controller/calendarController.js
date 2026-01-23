(function () {

// controller/calendarController.js

function showCalendar() {
  calendarModel.resetToToday();
  calendarView.render(calendarModel.buildCalendarData());
}

function prevMonth() {
  calendarModel.prevMonth();
  calendarView.render(calendarModel.buildCalendarData());
}

function nextMonth() {
  calendarModel.nextMonth();
  calendarView.render(calendarModel.buildCalendarData());
}

function onDayClick(dateKey, hasLog) {
  if (hasLog) {
    timelineController.openTimeline (dateKey);
  } else {
    editController.openEdit(dateKey);
  }
}

window.calendarController = {
  showCalendar,
  prevMonth,
  nextMonth,
  onDayClick
};

})();
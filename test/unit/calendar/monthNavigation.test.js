import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/model/calendarModel.js');
});

describe('calendarModel month navigation', () => {

  test('prevMonth / nextMonth が年跨ぎを正しく処理する', () => {
    calendarModel.setMonth(2026, 0); // Jan
    calendarModel.prevMonth();

    expect(calendarModel.state.year).toBe(2025);
    expect(calendarModel.state.month).toBe(11);

    calendarModel.nextMonth();
    expect(calendarModel.state.year).toBe(2026);
    expect(calendarModel.state.month).toBe(0);
  });

});

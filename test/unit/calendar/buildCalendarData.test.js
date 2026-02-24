import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/settingModel.js');
  loadBrowserScript('../app/model/calendarModel.js');
});

describe('calendarModel.buildCalendarData', () => {

  beforeEach(() => {
    localStorage.clear();
  });

test('ログから日付キー付きデータが生成される', () => {
  const logs = [
    { date: '2026-01-01', count: 1, status: 'smoke' }
  ];

  const data = calendarModel.buildCalendarData(
    logs,
    '2026-01-03'
  );

  expect(data).toHaveProperty('2026-01-01');

  expect(data['2026-01-01'].count).toBe(1);
  expect(data['2026-01-01'].status).toBe('smoke');
  expect(data['2026-01-02']).toBeUndefined();
});

test('dailyData の memo をマージできる', () => {
  const logs = [{ date: '2026-01-01', count: 1, status: 'smoke' }];
  const dailyData = { '2026-01-02': 'メモあり' };

  const data = calendarModel.buildCalendarData(logs, '2026-01-03', dailyData);

  expect(data['2026-01-02'].count).toBeNull();
  expect(data['2026-01-02'].status).toBe('unrecorded');
  expect(data['2026-01-02'].memo).toBe('メモあり');
});

});

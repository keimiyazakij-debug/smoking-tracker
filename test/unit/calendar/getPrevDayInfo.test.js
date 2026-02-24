/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/calendarModel.js');
});

describe('calendarModel public API (前日参照ロジック削除後)', () => {
  test('getPrevDayInfo は公開されない', () => {
    expect(window.calendarModel.getPrevDayInfo).toBeUndefined();
  });
});

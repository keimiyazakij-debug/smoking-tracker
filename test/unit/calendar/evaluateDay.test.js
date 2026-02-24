/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/calendarModel.js');
});

describe('calendarModel public API (評価ロジック削除後)', () => {
  test('evaluateDay は公開されない', () => {
    expect(window.calendarModel.evaluateDay).toBeUndefined();
  });
});

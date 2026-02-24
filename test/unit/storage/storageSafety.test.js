/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

// beforeAll or beforeEach で読み込む
beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/logModel.js');
});

import '../../../app/model/badgeModel.js';
import '../../../app/model/dailyTaskModel.js';

describe('storage safety tests', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('dailyLogs が未定義でも getLogs は {} を返す', () => {
    const logs = window.logModel.getLogs();
    expect(logs).toEqual({});
  });

  test('dailyLogs が壊れた JSON でも getLogs は例外を出さない', () => {
    localStorage.setItem('dailyLogs', '{broken json');

    expect(() => window.logModel.getLogs()).not.toThrow();
    expect(window.logModel.getLogs()).toEqual({});
  });

  test('setLogs → getLogs が往復一致する', () => {
    const data = {
      '2026-01-02': ['2026-01-02T10:00:00+09:00']
    };

    window.logModel.setLogs(data);
    expect(window.logModel.getLogs()).toEqual(data);
  });

  test('badgeDone が壊れていても evaluateBadges が落ちない', () => {
    localStorage.setItem('badgeDone', '{oops');

    global.BADGES = [];
    expect(() =>
      window.badgeModel.evaluateBadges({})
    ).not.toThrow();
  });

  test('dailyDone が壊れていても evaluate が落ちない', () => {
    localStorage.setItem('dailyDone', '{oops');

    global.DAILY_TASKS = [];
    expect(() =>
      window.dailyTaskModel.evaluate({ todayKey: '2026-01-02' })
    ).not.toThrow();
  });

});

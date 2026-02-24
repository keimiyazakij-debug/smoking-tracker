/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  window.logModel = {
    getLogs: () => JSON.parse(localStorage.getItem('dailyLogs') || '{}'),
    setLogs: (logs) => localStorage.setItem('dailyLogs', JSON.stringify(logs || {})),
  };
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/editModel.js', {
    logModel: window.logModel,
  });
});

describe('editModel.save', () => {

  beforeEach(() => {
    localStorage.clear();
    editModel.open('2026-01-02');
  });

  test('時刻を ISO 文字列で保存する', () => {
    editModel.addTime('10:00');
    editModel.save();

    const logs = JSON.parse(localStorage.getItem('dailyLogs'));
    expect(logs['2026-01-02'][0])
      .toBe(new Date('2026-01-02T10:00:00').toISOString());
  });

  test('時刻は昇順に sort される', () => {
    editModel.addTime('18:00');
    editModel.addTime('09:00');
    editModel.save();

    const logs = JSON.parse(localStorage.getItem('dailyLogs'));
    const times = logs['2026-01-02'];

    expect(new Date(times[0]).getTime())
      .toBeLessThan(new Date(times[1]).getTime());  
  });

  test('空要素は除外される', () => {
    editModel.addTime('');
    editModel.addTime('10:00');
    editModel.save();

    const logs = JSON.parse(localStorage.getItem('dailyLogs'));
    expect(logs['2026-01-02']).toHaveLength(1);
  });

  test('hasChanges: 変更なしなら false', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-02': [new Date('2026-01-02T09:00:00').toISOString()]
    }));
    editModel.open('2026-01-02');

    expect(editModel.hasChanges('2026-01-02')).toBe(false);
  });

  test('hasChanges: 時刻変更ありなら true', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2026-01-02': [new Date('2026-01-02T09:00:00').toISOString()]
    }));
    editModel.open('2026-01-02');
    editModel.updateTime(0, '10:00');

    expect(editModel.hasChanges('2026-01-02')).toBe(true);
  });

});

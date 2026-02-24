/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('settingModel', () => {
  beforeAll(() => {
    loadBrowserScript('../app/model/settingModel.js');
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('loadSettings: 未設定時はデフォルト値を返す', () => {
    expect(window.settingModel.loadSettings()).toEqual({
      dailyTarget: 10,
      calendarEvaluation: 'target',
    });
  });

  test('loadSettings: 壊れた JSON でもデフォルト値を返す', () => {
    localStorage.setItem('settings', '{broken');
    expect(window.settingModel.loadSettings()).toEqual({
      dailyTarget: 10,
      calendarEvaluation: 'target',
    });
  });

  test('loadSettings: 部分データをデフォルトで補完する', () => {
    localStorage.setItem('settings', JSON.stringify({ dailyTarget: 15 }));
    expect(window.settingModel.loadSettings()).toEqual({
      dailyTarget: 15,
      calendarEvaluation: 'target',
    });
  });

  test('saveSettings: 不足プロパティを補完して保存する', () => {
    window.settingModel.saveSettings({ dailyTarget: 8 });
    expect(JSON.parse(localStorage.getItem('settings'))).toEqual({
      dailyTarget: 8,
      calendarEvaluation: 'target',
    });
  });
});

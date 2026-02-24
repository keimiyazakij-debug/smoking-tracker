/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('settingController', () => {
  beforeEach(() => {
    localStorage.clear();
    window.isDevMode = undefined;
    document.body.innerHTML = `
      <div id="settings"></div>
      <div id="planInfo"></div>
      <input id="dailyTarget" class="setting-input" />
      <input type="radio" name="calendarEvaluation" value="target" />
      <input type="radio" name="calendarEvaluation" value="none" />
      <button id="exportDataBtn" type="button"></button>
      <button id="importDataBtn" type="button"></button>
      <input id="importDataFile" type="file" />
    `;

    window.settingModel = {
      loadSettings: jest.fn(() => ({
        dailyTarget: 10,
        calendarEvaluation: 'target',
      })),
      saveSettings: jest.fn(),
    };
    window.onLogChanged = jest.fn();
  });

  test('DOMContentLoaded で入力値とラジオ状態を読み込む', () => {
    window.settingModel.loadSettings.mockReturnValue({
      dailyTarget: 12,
      calendarEvaluation: 'none',
    });

    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('dailyTarget').value).toBe('12');
    const target = document.querySelector("input[name='calendarEvaluation'][value='target']");
    const none = document.querySelector("input[name='calendarEvaluation'][value='none']");
    expect(target.checked).toBe(false);
    expect(none.checked).toBe(true);
  });

  test('目標入力変更で settings を保存し onLogChanged を呼ぶ', () => {
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const input = document.getElementById('dailyTarget');
    input.value = '15';
    input.dispatchEvent(new Event('input'));

    expect(window.settingModel.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyTarget: 15 })
    );
    expect(window.onLogChanged).toHaveBeenCalled();
  });

  test('onLogChanged が未定義でも入力変更で例外にならない', () => {
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: undefined,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const input = document.getElementById('dailyTarget');
    input.value = '18';
    expect(() => {
      input.dispatchEvent(new Event('input'));
    }).not.toThrow();
    expect(window.settingModel.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyTarget: 18 })
    );
  });

  test('resetAll / isPremium が公開される', () => {
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(typeof window.resetAll).toBe('function');
    expect(typeof window.exportData).toBe('function');
    expect(typeof window.importData).toBe('function');
    expect(typeof window.isPremium).toBe('function');
    expect(window.isPremium()).toBe(false);
  });

  test('exportData: localStorage を JSON でダウンロードする', () => {
    localStorage.setItem('foo', 'bar');
    const createObjectURL = jest.fn(() => 'blob:mock-url');
    const revokeObjectURL = jest.fn();
    const mockBlob = jest.fn(function MockBlob() {});
    const clickSpy = jest.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
      URL: { createObjectURL, revokeObjectURL },
      Blob: mockBlob,
      alert: jest.fn(),
    });

    window.exportData();

    expect(mockBlob).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    clickSpy.mockRestore();
  });

  test('importData: JSON を復元して reload する', () => {
    const mockStorage = {
      clear: jest.fn(),
      setItem: jest.fn(),
    };
    const mockLocation = { reload: jest.fn() };
    const mockAlert = jest.fn();
    class MockFileReader {
      readAsText() {
        this.onload({
          target: {
            result: JSON.stringify({ a: '1', b: '2' }),
          },
        });
      }
    }

    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      confirm: () => true,
      localStorage: mockStorage,
      location: mockLocation,
      alert: mockAlert,
      FileReader: MockFileReader,
    });

    window.importData({ name: 'backup.json' });

    expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    expect(mockStorage.setItem).toHaveBeenCalledWith('a', '1');
    expect(mockStorage.setItem).toHaveBeenCalledWith('b', '2');
    expect(mockAlert).toHaveBeenCalledWith('インポートが完了しました。再読み込みします。');
    expect(mockLocation.reload).toHaveBeenCalledTimes(1);
  });

  test('開発モード時はデバッグセクションが表示される', () => {
    window.isDevMode = true;
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('settingsDebugSection')).not.toBeNull();
    expect(document.getElementById('debugPremiumToggle')).not.toBeNull();
  });

  test('デバッグトグル変更で premium 状態を保存し onLogChanged を呼ぶ', () => {
    window.isDevMode = true;
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      onLogChanged: window.onLogChanged,
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const toggle = document.getElementById('debugPremiumToggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(localStorage.getItem('debug_isPremium')).toBe('true');
    expect(window.isPremium()).toBe(true);
    expect(window.onLogChanged).toHaveBeenCalled();
  });

  test('resetAll: confirm が false の場合は clear/reload しない', () => {
    const mockStorage = { clear: jest.fn() };
    const mockLocation = { reload: jest.fn() };
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      confirm: () => false,
      localStorage: mockStorage,
      location: mockLocation,
    });
    window.resetAll();
    expect(mockStorage.clear).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  test('resetAll: confirm が true の場合は clear/reload する', () => {
    const mockStorage = { clear: jest.fn() };
    const mockLocation = { reload: jest.fn() };
    loadBrowserScript('../app/controller/settingController.js', {
      settingModel: window.settingModel,
      confirm: () => true,
      localStorage: mockStorage,
      location: mockLocation,
    });
    window.resetAll();
    expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    expect(mockLocation.reload).toHaveBeenCalledTimes(1);
  });
});

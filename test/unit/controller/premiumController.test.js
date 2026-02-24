/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('premiumController', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="main" class="tab active"></div>
      <div id="premiumOverlay"></div>
    `;

    window.premiumView = {
      open: jest.fn(),
      close: jest.fn(),
    };
    window.messageController = {
      enqueue: jest.fn(),
    };
    window.showTab = jest.fn();

    loadBrowserScript('../app/controller/premiumController.js', {
      premiumView: window.premiumView,
      messageController: window.messageController,
      showTab: window.showTab,
    });
  });

  test('openPremiumView: premiumView.open を呼ぶ', () => {
    window.premiumController.openPremiumView();
    expect(window.premiumView.open).toHaveBeenCalledTimes(1);
  });

  test('closePremiumView: 元のタブへ戻る', () => {
    window.premiumController.openPremiumView();
    window.premiumController.closePremiumView();

    expect(window.premiumView.close).toHaveBeenCalledTimes(1);
    expect(window.showTab).toHaveBeenCalledWith('main');
  });

  test('upgrade: 準備中メッセージを enqueue する', () => {
    window.premiumController.upgrade();
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'msg',
      text: 'アップグレード機能は準備中です。',
      priority: -1,
    });
  });

  test('navigateTo: PremiumView 指定で openPremiumView が呼ばれる', () => {
    window.navigateTo('PremiumView');
    expect(window.premiumView.open).toHaveBeenCalledTimes(1);
  });
});

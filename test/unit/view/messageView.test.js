/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('messageView', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    document.body.innerHTML = ``;
    loadBrowserScript('../app/view/messageView.js');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('showMessageWithAutoClose: メッセージが表示される', () => {
    window.messageView.showMessageWithAutoClose('test message', jest.fn());

    const toast = document.getElementById('appToast');
    expect(toast.textContent).toBe('test message');
  });

  test('showMessageWithAutoClose: 3秒後にメッセージが消え、onCloseが呼ばれる', () => {
    const onClose = jest.fn();

    window.messageView.showMessageWithAutoClose('test', onClose);

    // 3秒経過
    jest.advanceTimersByTime(3000);

    const toast = document.getElementById('appToast');
    expect(toast.textContent).toBe('test');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('hideMessage: is-visible クラスが外れる', () => {
    window.messageView.addMessage('test');
    const toast = document.getElementById('appToast');
    expect(toast.classList.contains('is-visible')).toBe(true);

    window.messageView.hideMessage();

    expect(toast.classList.contains('is-visible')).toBe(false);
  });

  test('addMessage: position=top で上部トーストクラスが付く', () => {
    window.messageView.addMessage({
      text: 'saved',
      position: 'top',
    });

    const toast = document.getElementById('appToast');
    expect(toast.classList.contains('app-toast--top')).toBe(true);
    expect(toast.textContent).toBe('saved');
  });
});

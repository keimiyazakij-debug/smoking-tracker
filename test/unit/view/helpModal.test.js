/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('helpModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };
    document.body.innerHTML = `
      <a id="openHelpBtn" href="#helpModal">help</a>
      <div id="helpModal" class="help-modal hidden">
        <button id="closeHelpBtn" type="button">x</button>
      </div>
    `;
    loadBrowserScript('../app/helpModal.js', {
      requestAnimationFrame: window.requestAnimationFrame
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('open: リンククリックで default を抑止し、モーダル表示状態になる', () => {
    const open = document.getElementById('openHelpBtn');
    const modal = document.getElementById('helpModal');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const dispatchResult = open.dispatchEvent(click);

    expect(dispatchResult).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(modal.classList.contains('visible')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('close: 閉じる操作でモーダルを非表示化し body overflow を戻す', () => {
    const open = document.getElementById('openHelpBtn');
    const modal = document.getElementById('helpModal');
    const close = document.getElementById('closeHelpBtn');

    open.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    close.click();
    jest.advanceTimersByTime(200);

    expect(modal.classList.contains('visible')).toBe(false);
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });
});

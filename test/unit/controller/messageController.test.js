/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  window.__shown = [];
  window.__shownFallback = [];
  window.messageView = {
    addMessage: (text) => {
      window.__shown.push(text);
    },
    showMessageWithAutoClose: (text, onClose) => {
      window.__shownFallback.push(text);
      onClose();
    },
    hideMessage: () => {}
  };
  loadBrowserScript('../app/controller/messageController.js', {
    messageView: window.messageView
  });
});

beforeEach(() => {
  window.__shown = [];
  window.__shownFallback = [];
  delete window.calendarController;
  window.messageView.addMessage = jest.fn((text) => {
    window.__shown.push(text);
  });
  window.messageView.showMessageWithAutoClose = jest.fn((text, onClose) => {
    window.__shownFallback.push(text);
    onClose();
  });
});

describe('messageController.enqueue', () => {

  test('単一メッセージが表示される', () => {
    messageController.enqueue({ type: 'msg', text: 'A' });
    expect(window.__shown).toEqual(['A']);
  });

  test('premium_lock は 詳細を見るアクション付きで表示される', () => {
    window.navigateTo = jest.fn();
    messageController.enqueue({
      type: 'premium_lock',
      text: '60日より前のデータはプレミアム版で閲覧できます。',
    });

    expect(window.__shown).toHaveLength(1);
    const payload = window.__shown[0];
    expect(payload).toEqual(
      expect.objectContaining({
        text: '60日より前のデータはプレミアム版で閲覧できます。',
        actionLabel: '詳細を見る',
        onAction: expect.any(Function),
      })
    );

    payload.onAction();
    expect(window.navigateTo).toHaveBeenCalledWith('PremiumView');
  });

  test('複数メッセージが順番通り表示される', () => {
    messageController.enqueue(
      { type: 'msg', text: 'A' },
      { type: 'msg', text: 'B' },
      { type: 'msg', text: 'C' }
    );

    expect(window.__shown).toEqual(['A', 'B', 'C']);
  });

  test('配列で渡しても順序が保たれる', () => {
    messageController.enqueue([
      { type: 'msg', text: 'A' },
      { type: 'msg', text: 'B' }
    ]);

    expect(window.__shown).toEqual(['A', 'B']);
  });

  test('短期メッセージ（priority<0）は即時表示される', () => {
    messageController.enqueue(
      { type: 'daily' },
      { type: 'msg', text: 'short', priority: -1 }
    );

    expect(window.__shown).toContain('short');
  });

  test('TTL超過のメッセージは表示されない', () => {
    const past = Date.now() - 10000;
    messageController.enqueue(
      { type: 'msg', text: 'expired', createdAt: past, ttlMs: 1000 }
    );

    expect(window.__shown).toEqual([]);
  });

  test('null/空テキスト/未知typeはスキップされる', () => {
    messageController.enqueue(
      null,
      { type: 'msg', text: '' },
      { type: 'unknown' }
    );
    expect(window.__shown).toEqual([]);
    expect(window.__shownFallback).toEqual([]);
  });

  test('TTL内メッセージは表示される', () => {
    const recent = Date.now() - 500;
    messageController.enqueue(
      { type: 'msg', text: 'fresh', createdAt: recent, ttlMs: 1000 }
    );
    expect(window.__shown).toEqual(['fresh']);
  });

  test('addMessage が無い場合は showMessageWithAutoClose へフォールバックする', () => {
    delete window.messageView.addMessage;
    messageController.enqueue({ type: 'msg', text: 'fallback' });
    expect(window.__shownFallback).toEqual(['fallback']);
  });

  test('calendarController があればトーストではなくインラインメッセージを使う', () => {
    window.calendarController = {
      setInlineMessage: jest.fn(),
    };

    messageController.enqueue({ type: 'msg', text: 'inline' });

    expect(window.calendarController.setInlineMessage).toHaveBeenCalledWith('inline');
    expect(window.__shown).toEqual([]);
    expect(window.__shownFallback).toEqual([]);
  });

  test('forceToast=true の msg はインラインに送らずトースト表示する', () => {
    window.calendarController = {
      setInlineMessage: jest.fn(),
    };

    messageController.enqueue({
      type: 'msg',
      text: '修正しました',
      forceToast: true,
      toastPosition: 'top',
    });

    expect(window.calendarController.setInlineMessage).not.toHaveBeenCalled();
    expect(window.__shown).toEqual([
      { text: '修正しました', position: 'top' },
    ]);
  });

});

describe('messageController.showMessage', () => {
  test('通常は addMessage を使う', () => {
    messageController.showMessage('hello');
    expect(window.__shown).toEqual(['hello']);
  });

  test('addMessage が無い場合は showMessageWithAutoClose を使う', () => {
    delete window.messageView.addMessage;
    messageController.showMessage('hello2');
    expect(window.__shownFallback).toEqual(['hello2']);
  });

  test('空文字は表示しない', () => {
    messageController.showMessage('');
    expect(window.__shown).toEqual([]);
    expect(window.__shownFallback).toEqual([]);
  });
});

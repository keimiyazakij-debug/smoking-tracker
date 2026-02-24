/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/controller/messageController.js');
});

describe('buildMessageText', () => {

  test('badge イベント', () => {
    const text = buildMessageText({
      type: 'badge',
      label: 'テストバッジ'
    });
    expect(text).toBe('🎉 バッジ獲得：テストバッジ');
  });

  test('daily イベント', () => {
    const text = buildMessageText({ type: 'daily' });
    expect(text).toBe('✅ 今日のチャレンジ達成');
  });

  test('msg イベント', () => {
    const text = buildMessageText({ type: 'msg', text: 'hello' });
    expect(text).toBe('hello');
  });

  test('premium_lock イベント', () => {
    const text = buildMessageText({ type: 'premium_lock', text: 'locked' });
    expect(text).toBe('locked');
  });

  test('不明 type は空文字', () => {
    expect(buildMessageText({ type: 'xxx' })).toBe('');
  });

});

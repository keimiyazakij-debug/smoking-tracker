/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('dailyTaskView', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="gameChallenge" class="tab">
        <button id="dcBack"></button>
        <button id="dcPrev"></button>
        <h2 id="dcTitle"></h2>
        <button id="dcNext"></button>
        <div id="dcRecommended"></div>
        <div id="dcList"></div>
      </div>
    `;
    window.showTab = jest.fn((tabId) => {
      document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');
    });
    window.dailyTaskController = { move: jest.fn() };
    loadBrowserScript('../app/view/dailyTaskView.js', {
      showTab: window.showTab,
      dailyTaskController: window.dailyTaskController,
    });
  });

  test('open: gameChallenge タブへ遷移する', () => {
    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks: [],
      canNext: false,
    });

    expect(window.showTab).toHaveBeenCalledWith('gameChallenge');
    expect(document.getElementById('gameChallenge').classList.contains('active')).toBe(true);
  });

  test('close: game ハブへ戻る', () => {
    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks: [],
      canNext: false,
    });
    window.dailyTaskView.close();

    expect(window.showTab).toHaveBeenLastCalledWith('game');
  });

  test('tasks: タスク数分DOMが描画される', () => {
    const tasks = [
      { id: 't1', label: 'task1', done: false },
      { id: 't2', label: 'task2', done: true },
    ];

    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks,
      canNext: false,
    });

    const items = document.querySelectorAll('.challenge-item');
    expect(items.length).toBe(2);
  });

  test('tasks: 完了タスクにdoneクラスが付与される', () => {
    const tasks = [
      { id: 't1', label: 'task1', done: true },
    ];

    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks,
      canNext: false,
    });

    const item = document.querySelector('.challenge-item');
    expect(item.classList.contains('done')).toBe(true);
  });

  test('recommended: 今日の提案が表示され、該当行にrecommendedクラスが付く', () => {
    const tasks = [
      { id: 'morning_reduce', label: '朝の1本を減らしてみる。', done: false },
      { id: 'night_reduce', label: '夜の1本を減らしてみる。', done: false },
    ];

    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks,
      recommendedTaskId: 'night_reduce',
      recommendedTaskLabel: '夜の1本を減らしてみる。',
      canNext: false,
    });

    const recommendedLabel = document.getElementById('dcRecommended');
    expect(recommendedLabel.textContent).toBe('夜の1本を減らしてみる。');

    const recommendedItem = Array.from(document.querySelectorAll('.challenge-item'))
      .find((el) => el.textContent === '夜の1本を減らしてみる。');
    expect(recommendedItem).toBeTruthy();
    expect(recommendedItem.classList.contains('recommended')).toBe(true);
  });

  test('isOpen: open/close の状態を返す', () => {
    window.dailyTaskView.close();
    expect(window.dailyTaskView.isOpen()).toBe(false);

    window.dailyTaskView.open({
      dateKey: '2026-02-01',
      title: '今日のチャレンジ',
      tasks: [],
      canNext: false,
    });
    expect(window.dailyTaskView.isOpen()).toBe(true);

    window.dailyTaskView.close();
    expect(window.dailyTaskView.isOpen()).toBe(false);
  });
});

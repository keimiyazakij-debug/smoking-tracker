/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('timelineView', () => {
  beforeEach(() => {
    // ===== index.html 相当の DOM を先に用意 =====
    document.body.innerHTML = `
      <button id="prevTimelineDay"></button>
      <button id="nextTimelineDay"></button>
      <div id="timelineList"></div>
      <div id="timelineSelectionSummary"></div>
    `;

    // ===== 依存モック =====
    window.timelineController = {
      openEditForHour: jest.fn(),
      goPrevDay: jest.fn(),
      goNextDay: jest.fn(),
    };

    // ===== View 読み込み（依存を VM に注入）=====
    loadBrowserScript(
      '../app/view/timelineView.js',
      {
        timelineController: window.timelineController,
      }
    );
  });

  test('render: 0〜23時の24時間分が描画される', () => {
    window.timelineView.render({});

    const rows = document.querySelectorAll('.timeline-hour');
    expect(rows.length).toBe(24);
    expect(rows[0].textContent).toBe('0時');
    expect(rows[23].textContent).toBe('23時');
  });

  test('render: ログがある時間帯に本数が表示される', () => {
    window.timelineView.render({
      9: ['09:05', '09:30'],
      15: ['15:10'],
    });

    const counts = document.querySelectorAll('.timeline-count');
    const texts = Array.from(counts).map(e => e.textContent);

    expect(texts).toContain('2本');
    expect(texts).toContain('1本');
  });

  test('prevTimelineDay: クリックで controller.goPrevDay が呼ばれる', () => {
    document.getElementById('prevTimelineDay').click();
    expect(window.timelineController.goPrevDay).toHaveBeenCalledTimes(1);
  });

  test('nextTimelineDay: クリックで controller.goNextDay が呼ばれる', () => {
    document.getElementById('nextTimelineDay').click();
    expect(window.timelineController.goNextDay)
      .toHaveBeenCalledTimes(1);
  });

  test('render: 本数に応じたヒートクラスが適用される', () => {
    window.timelineView.render({
      1: ['01:00'],
      2: ['02:00', '02:10'],
      3: ['03:00', '03:10', '03:20'],
      4: ['04:00', '04:10', '04:20', '04:30']
    });

    const cells = Array.from(document.querySelectorAll('.timeline-cell'));
    expect(cells[1].className).toContain('count-1');
    expect(cells[2].className).toContain('count-2');
    expect(cells[3].className).toContain('count-3');
    expect(cells[4].className).toContain('count-4');
  });

  test('セルクリック: 選択サマリー更新と時間指定編集遷移を行う', () => {
    window.timelineView.setDateKey('2026-02-13');
    window.timelineView.render({
      9: ['09:05', '09:30']
    });

    const hour9Button = document.querySelectorAll('.timeline-cell button')[9];
    hour9Button.click();

    expect(document.getElementById('timelineSelectionSummary').innerHTML)
      .toContain('2026/02/13');
    expect(document.getElementById('timelineSelectionSummary').innerHTML)
      .toContain('<strong>2本</strong>');
    expect(window.timelineController.openEditForHour).toHaveBeenCalledWith(9);
  });

  test('セルクリック: 記録なし時間でも時間指定編集遷移を行う', () => {
    window.timelineView.setDateKey('2026-02-13');
    window.timelineView.render({});

    const hour0Button = document.querySelectorAll('.timeline-cell button')[0];
    hour0Button.click();

    expect(window.timelineController.openEditForHour).toHaveBeenCalledWith(0);
  });

  test('setSelectedSummary: dateKey 未指定時は更新しない', () => {
    const el = document.getElementById('timelineSelectionSummary');
    el.innerHTML = 'initial';

    window.timelineView.setSelectedSummary(null, 3);
    expect(el.innerHTML).toBe('initial');
  });

  test('renderLocked: ロックメッセージを表示する', () => {
    window.timelineView.renderLocked('locked message');
    const list = document.getElementById('timelineList');
    expect(list.textContent).toContain('locked message');
  });
});

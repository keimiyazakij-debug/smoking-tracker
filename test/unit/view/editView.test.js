/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('editView', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T23:59:00'));
    // ===== index.html 相当の DOM =====
    document.body.innerHTML = `
      <button id="addTimeTagBtn"></button>
      <button id="saveEditBtn"></button>
      <button id="closeEditBtn"></button>

      <div id="editOverlay" class="hidden">
        <h2 id="editTitle"></h2>
        <input id="editDateInput" />
        <p id="editDateLockNotice"></p>
        <div id="timeTags"></div>
      </div>
    `;

    // ===== Controller モック =====
    window.editController = {
      addTimeTag: jest.fn(),
      saveEdit: jest.fn(),
      closeEdit: jest.fn(),
      updateTime: jest.fn(),
      removeTime: jest.fn(),
    };
    window.common = {
      isDateLocked: jest.fn(() => false),
      getDateKey: jest.fn(() => '2026-02-01'),
    };

    // ===== View 読み込み（VMに依存注入）=====
    loadBrowserScript(
      '../app/view/editView.js',
      {
        editController: window.editController,
        common: window.common,
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('open: overlayが表示され、タイトルと日付が設定される', () => {
    const state = {
      dateKey: '2026-02-01',
      title: '記録を編集',
      times: ['09:00', '15:30'],
    };

    window.editView.open(state);

    expect(document.getElementById('editOverlay')
      .classList.contains('hidden')).toBe(false);

    expect(document.getElementById('editTitle').textContent)
      .toBe('記録を編集');

    expect(document.getElementById('editDateInput').value)
      .toBe('2026-02-01');
    expect(document.getElementById('editDateInput').disabled).toBe(false);
  });

  test('render: timeTags が時刻数分描画される', () => {
    const state = {
      dateKey: '2026-02-01',
      times: ['09:00', '15:30'],
    };

    window.editView.render(state);

    const tags = document.querySelectorAll('.time-tag');
    expect(tags.length).toBe(2);

    const hours = document.querySelectorAll('.time-select-hour');
    const minutes = document.querySelectorAll('.time-select-minute');
    expect(hours[0].value).toBe('09');
    expect(minutes[0].value).toBe('00');
    expect(hours[1].value).toBe('15');
    expect(minutes[1].value).toBe('30');
  });

  test('render: 時刻変更で controller.updateTime が呼ばれる', () => {
    const state = {
      dateKey: '2026-02-01',
      times: ['09:00'],
    };

    window.editView.render(state);

    const hour = document.querySelector('.time-select-hour');
    const minute = document.querySelector('.time-select-minute');
    hour.value = '10';
    hour.dispatchEvent(new Event('change'));
    minute.value = '15';
    minute.dispatchEvent(new Event('change'));

    expect(window.editController.updateTime)
      .toHaveBeenLastCalledWith(0, '10:15');
  });

  test('render: 削除ボタンで controller.removeTime が呼ばれる', () => {
    const state = {
      dateKey: '2026-02-01',
      times: ['09:00'],
    };

    window.editView.render(state);

    const delBtn = document.querySelector('.time-tag button');
    delBtn.click();

    expect(window.editController.removeTime)
      .toHaveBeenCalledWith(0);
  });

  test('close: overlayが非表示になり、timeTagsがクリアされる', () => {
    const state = {
      dateKey: '2026-02-01',
      times: ['09:00'],
    };

    window.editView.open(state);
    window.editView.close();

    expect(document.getElementById('editOverlay')
      .classList.contains('hidden')).toBe(true);

    expect(document.getElementById('timeTags').innerHTML)
      .toBe('');
  });

  test('isOpen: open/close の状態を返す', () => {
    const state = {
      dateKey: '2026-02-01',
      title: '記録を編集',
      times: [],
    };

    expect(window.editView.isOpen()).toBe(false);
    window.editView.open(state);
    expect(window.editView.isOpen()).toBe(true);
    window.editView.close();
    expect(window.editView.isOpen()).toBe(false);
  });

  test('buttons: add / save / close が controller に接続されている', () => {
    document.getElementById('addTimeTagBtn').click();
    document.getElementById('saveEditBtn').click();
    document.getElementById('closeEditBtn').click();

    expect(window.editController.addTimeTag).toHaveBeenCalledTimes(1);
    expect(window.editController.saveEdit).toHaveBeenCalledTimes(1);
    expect(window.editController.closeEdit).toHaveBeenCalledTimes(1);
  });

  test('日付がロック対象になると保存ボタンが無効化され、注意文が表示される', () => {
    window.common.isDateLocked.mockImplementation((dateKey) => dateKey === '2025-01-01');
    window.editView.open({
      dateKey: '2026-02-01',
      title: '記録を編集',
      times: ['09:00'],
    });

    const dateInput = document.getElementById('editDateInput');
    const saveBtn = document.getElementById('saveEditBtn');
    const notice = document.getElementById('editDateLockNotice');

    expect(saveBtn.disabled).toBe(false);
    expect(notice.textContent).toBe('');

    dateInput.value = '2025-01-01';
    dateInput.dispatchEvent(new Event('input'));

    expect(saveBtn.disabled).toBe(true);
    expect(notice.textContent).toBe('60日より前のデータはプレミアム版で編集できます');
  });

  test('時刻が0件のときは保存ボタンが無効化される', () => {
    window.editView.open({
      dateKey: '2026-02-01',
      title: '記録を編集',
      times: [],
    });

    const saveBtn = document.getElementById('saveEditBtn');
    const notice = document.getElementById('editDateLockNotice');
    expect(saveBtn.disabled).toBe(true);
    expect(notice.textContent).toBe('時刻を1件以上入力してください');
  });
});

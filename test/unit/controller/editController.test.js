/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

describe('editController', () => {
  beforeEach(() => {
    // ===== editModel モック =====
    window.editModel = {
      open: jest.fn(),
      close: jest.fn(),
      getState: jest.fn(() => ({
        dateKey: '2026-02-01',
        times: ['09:00'],
      })),
      addTime: jest.fn(),
      updateTime: jest.fn(),
      removeTime: jest.fn(),
      setDateKey: jest.fn(),
      save: jest.fn(),
      hasChanges: jest.fn(() => true),
    };

    // ===== editView モック =====
    window.editView = {
      open: jest.fn(),
      close: jest.fn(),
      render: jest.fn(),
      isOpen: jest.fn(() => false),
      getEditedDate: jest.fn(() => '2026-02-01'),
    };

    // ===== message / global =====
    window.messageController = {
      enqueue: jest.fn(),
    };

    window.onLogChanged = jest.fn();

    window.timelineController = {
      openTimeline: jest.fn(),
    };

    window.showTab = jest.fn();
    window.common = {
      isDateLocked: jest.fn(() => false),
      getDateKey: jest.fn(() => '2026-02-10'),
    };

    // ===== Controller 読み込み =====
    loadBrowserScript(
      '../app/controller/editController.js',
      {
        editModel: window.editModel,
        editView: window.editView,
        messageController: window.messageController,
        onLogChanged: window.onLogChanged,
        timelineController: window.timelineController,
        showTab: window.showTab,
        common: window.common,
      }
    );

    jest.clearAllMocks();
  });

  // =========================
  // openEdit
  // =========================
  test('openEdit: model.open → view.open が呼ばれる', () => {
    window.editController.openEdit('2026-02-01');

    expect(window.editModel.open)
      .toHaveBeenCalledWith('2026-02-01', {});

    expect(window.editView.open)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          dateKey: '2026-02-01',
          title: '記録を編集',
          times: ['09:00'],
        })
      );
  });

  test('openEdit: ロック日付は編集を開かずタイムラインへ戻す', () => {
    window.common.isDateLocked.mockReturnValue(true);
    window.editController.openEdit('2025-01-01');

    expect(window.editModel.open).not.toHaveBeenCalled();
    expect(window.editView.open).not.toHaveBeenCalled();
    expect(window.timelineController.openTimeline).toHaveBeenCalledWith('2025-01-01');
    expect(window.messageController.enqueue).toHaveBeenCalled();
  });

  // =========================
  // closeEdit
  // =========================
  test('closeEdit: model.close → view.close が呼ばれる', () => {
    window.editController.openEdit('2026-02-01');
    window.editController.closeEdit();

    expect(window.editModel.close).toHaveBeenCalled();
    expect(window.editView.close).toHaveBeenCalled();
    expect(window.timelineController.openTimeline)
      .toHaveBeenCalledWith('2026-02-01');
  });

  test('closeEdit: 遷移先が無い場合は showTab("timeline") にフォールバック', () => {
    window.timelineController = {};
    loadBrowserScript(
      '../app/controller/editController.js',
      {
        editModel: window.editModel,
        editView: window.editView,
        messageController: window.messageController,
        onLogChanged: window.onLogChanged,
        timelineController: window.timelineController,
        showTab: window.showTab,
        common: window.common,
      }
    );

    window.editController.closeEdit();
    expect(window.showTab).toHaveBeenCalledWith('timeline');
  });

  test('closeEdit: showTab も無い場合でも例外にならない', () => {
    window.timelineController = {};
    window.showTab = undefined;
    loadBrowserScript(
      '../app/controller/editController.js',
      {
        editModel: window.editModel,
        editView: window.editView,
        messageController: window.messageController,
        onLogChanged: window.onLogChanged,
        timelineController: window.timelineController,
        showTab: window.showTab,
        common: window.common,
      }
    );

    expect(() => window.editController.closeEdit()).not.toThrow();
  });

  // =========================
  // addTimeTag
  // =========================
  test('addTimeTag: 現在時刻を HH:MM 形式で追加し、view.render を呼ぶ', () => {
    jest.useFakeTimers().setSystemTime(
      new Date(Date.UTC(2026, 1, 1, 9, 5))
    );

    window.editController.addTimeTag();

    // HH:MM 形式で呼ばれていることだけ保証
    expect(window.editModel.addTime)
      .toHaveBeenCalledWith(expect.stringMatching(/^\d{2}:\d{2}$/));

    expect(window.editView.render)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          dateKey: '2026-02-01',
          title: '記録を編集',
          times: ['09:00'],
        })
      );

    jest.useRealTimers();
  });

  // =========================
  // updateTime
  // =========================
  test('updateTime: model.updateTime に委譲する', () => {
    window.editController.updateTime(0, '10:30');

    expect(window.editModel.updateTime)
      .toHaveBeenCalledWith(0, '10:30');
  });

  // =========================
  // removeTime
  // =========================
  test('removeTime: model.removeTime → view.render が呼ばれる', () => {
    window.editController.removeTime(0);

    expect(window.editModel.removeTime)
      .toHaveBeenCalledWith(0);

    expect(window.editView.render)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          dateKey: '2026-02-01',
          title: '記録を編集',
          times: ['09:00'],
        })
      );
  });

  // =========================
  // saveEdit
  // =========================
  test('saveEdit: 保存後は編集後日付で timeline に遷移する', () => {
    window.editController.openEdit('2026-02-01');
    window.editView.getEditedDate.mockReturnValue('2026-02-03');
    window.editController.saveEdit();

    expect(window.editModel.save).toHaveBeenCalled();
    expect(window.editModel.close).toHaveBeenCalled();
    expect(window.editView.close).toHaveBeenCalled();
    expect(window.timelineController.openTimeline)
      .toHaveBeenCalledWith('2026-02-03');

    expect(window.onLogChanged)
      .toHaveBeenCalledWith('2026-02-03');

    expect(window.messageController.enqueue)
      .toHaveBeenCalledWith({
        type: 'msg',
        text: '修正しました',
        priority: -1,
        forceToast: true,
        toastPosition: 'top',
      });

    expect(window.showTab).not.toHaveBeenCalled();
  });

  test('saveEdit: timelineController が無い場合は showTab("timeline") にフォールバック', () => {
    window.timelineController = {};
    loadBrowserScript(
      '../app/controller/editController.js',
      {
        editModel: window.editModel,
        editView: window.editView,
        messageController: window.messageController,
        onLogChanged: window.onLogChanged,
        timelineController: window.timelineController,
        showTab: window.showTab,
        common: window.common,
      }
    );
    window.editController.openEdit('2026-02-01');
    window.editController.saveEdit();

    expect(window.showTab).toHaveBeenCalledWith('timeline');
  });

  test('saveEdit: editedDate が空なら currentDateKey へフォールバックする', () => {
    window.editController.openEdit('2026-02-01');
    window.editView.getEditedDate.mockReturnValue('');
    window.editController.saveEdit();

    expect(window.timelineController.openTimeline)
      .toHaveBeenCalledWith('2026-02-01');
    expect(window.onLogChanged).toHaveBeenCalledWith('2026-02-01');
  });

  test('saveEdit: 変更がない場合は保存・トーストを行わない', () => {
    window.editModel.hasChanges.mockReturnValue(false);
    window.editController.openEdit('2026-02-01');
    window.editController.saveEdit();

    expect(window.editModel.save).not.toHaveBeenCalled();
    expect(window.onLogChanged).not.toHaveBeenCalled();
    expect(window.messageController.enqueue).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: '修正しました' })
    );
    expect(window.timelineController.openTimeline).toHaveBeenCalledWith('2026-02-01');
  });

  test('saveEdit: 時刻が0件なら保存せずメッセージを表示する', () => {
    window.editModel.getState.mockReturnValue({
      dateKey: '2026-02-01',
      times: [],
    });
    window.editController.openEdit('2026-02-01');

    window.editController.saveEdit();

    expect(window.editModel.save).not.toHaveBeenCalled();
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'msg',
      text: '時刻を1件以上入力してください',
      priority: -1,
    });
  });

  test('saveEdit: showTab も無い場合でも例外にならない', () => {
    window.timelineController = {};
    window.showTab = undefined;
    loadBrowserScript(
      '../app/controller/editController.js',
      {
        editModel: window.editModel,
        editView: window.editView,
        messageController: window.messageController,
        onLogChanged: window.onLogChanged,
        timelineController: window.timelineController,
        showTab: window.showTab,
        common: window.common,
      }
    );
    window.editController.openEdit('2026-02-01');

    expect(() => window.editController.saveEdit()).not.toThrow();
  });

  test('saveEdit: returnToMainOnSave=true でも timeline 遷移を優先', () => {
    window.editController.openEdit('2026-02-01', {
      returnToMainOnSave: true,
    });
    window.editView.getEditedDate.mockReturnValue('2026-02-02');
    window.editController.saveEdit();

    expect(window.timelineController.openTimeline)
      .toHaveBeenCalledWith('2026-02-02');
    expect(window.showTab).not.toHaveBeenCalledWith('main');
  });

  test('saveEdit: ロック日付は保存せずメッセージを出す', () => {
    window.common.isDateLocked.mockReturnValue(true);
    window.editController.openEdit('2026-02-01');
    window.editView.getEditedDate.mockReturnValue('2025-01-01');

    window.editController.saveEdit();

    expect(window.editModel.save).not.toHaveBeenCalled();
    expect(window.messageController.enqueue).toHaveBeenCalledWith({
      type: 'premium_lock',
      text: '60日より前のデータはプレミアム版で編集できます',
      priority: -1,
    });
  });

  test('saveEdit: window.onLogChanged 未定義でも例外にならない', () => {
    window.onLogChanged = undefined;
    window.editController.openEdit('2026-02-01');

    expect(() => {
      window.editController.saveEdit();
    }).not.toThrow();

    expect(window.editModel.save).toHaveBeenCalledTimes(1);
  });

  test('refreshFromStorage: 現在の dateKey を再読込して render する', () => {
    window.editController.openEdit('2026-02-01');
    window.editView.render.mockClear();

    window.editController.refreshFromStorage();

    expect(window.editModel.open).toHaveBeenCalledWith('2026-02-01', {});
    expect(window.editView.render).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: '2026-02-01',
        title: '記録を編集',
      })
    );
  });

  test('refreshFromStorage: 時間帯指定編集中は scopeHour を維持して再読込する', () => {
    window.editModel.getState.mockReturnValue({
      dateKey: '2026-02-01',
      times: ['09:00'],
      scopeHour: 9,
    });
    window.editController.openEdit('2026-02-01', { hour: 9 });
    window.editView.render.mockClear();
    window.editModel.open.mockClear();

    window.editController.refreshFromStorage();

    expect(window.editModel.open).toHaveBeenCalledWith('2026-02-01', { hour: 9 });
    expect(window.editView.render).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '記録を編集（9時台）',
      })
    );
  });

  test('refreshFromStorage: currentDateKey 未設定なら何もしない', () => {
    window.editController.refreshFromStorage();

    expect(window.editModel.open).not.toHaveBeenCalled();
    expect(window.editView.render).not.toHaveBeenCalled();
  });

  test('isOpenEdit: editView.isOpen の値を返す', () => {
    window.editView.isOpen.mockReturnValue(true);
    expect(window.editController.isOpenEdit()).toBe(true);

    window.editView.isOpen.mockReturnValue(false);
    expect(window.editController.isOpenEdit()).toBe(false);
  });
});

import { describe, expect, test } from 'vitest';
import { initialUIState, uiReducer } from '../../../src/state/ui/uiReducer';

describe('state/ui/uiReducer', () => {
  test('OPEN_TIMELINE_MODAL / CLOSE_TIMELINE_MODAL でモーダル開閉状態が切り替わる', () => {
    const opened = uiReducer(initialUIState, { type: 'OPEN_TIMELINE_MODAL' });
    const closed = uiReducer(opened, { type: 'CLOSE_TIMELINE_MODAL' });
    expect(opened.isTimelineModalOpen).toBe(true);
    expect(closed.isTimelineModalOpen).toBe(false);
  });

  test('SET_ACTIVE_TAB で選択タブが更新される', () => {
    const next = uiReducer(initialUIState, { type: 'SET_ACTIVE_TAB', tab: '/timeline' });
    expect(next.activeTab).toBe('/timeline');
  });

  test('SET_TEMPORARY_NOTICE_VISIBLE で一時表示フラグを更新する', () => {
    const next = uiReducer(initialUIState, { type: 'SET_TEMPORARY_NOTICE_VISIBLE', visible: true });
    expect(next.isTemporaryNoticeVisible).toBe(true);
  });
});

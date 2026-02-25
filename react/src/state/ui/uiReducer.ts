export type UIActiveTab = '/main' | '/calendar' | '/timeline' | '/game' | '/stats' | '/settings';

export type UIState = {
  isTimelineModalOpen: boolean;
  activeTab: UIActiveTab;
  isTemporaryNoticeVisible: boolean;
};

export type UIAction =
  | { type: 'OPEN_TIMELINE_MODAL' }
  | { type: 'CLOSE_TIMELINE_MODAL' }
  | { type: 'SET_ACTIVE_TAB'; tab: UIActiveTab }
  | { type: 'SET_TEMPORARY_NOTICE_VISIBLE'; visible: boolean };

export const initialUIState: UIState = {
  isTimelineModalOpen: false,
  activeTab: '/main',
  isTemporaryNoticeVisible: false,
};

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'OPEN_TIMELINE_MODAL':
      return { ...state, isTimelineModalOpen: true };
    case 'CLOSE_TIMELINE_MODAL':
      return { ...state, isTimelineModalOpen: false };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_TEMPORARY_NOTICE_VISIBLE':
      return { ...state, isTemporaryNoticeVisible: action.visible };
    default:
      return state;
  }
}

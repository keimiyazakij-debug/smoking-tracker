import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIContext } from '../state/ui/UIContext';
import type { UIActiveTab } from '../state/ui/uiReducer';

const tabs: Array<{ path: UIActiveTab; icon: string }> = [
  { path: '/main', icon: '⌂' },
  { path: '/calendar', icon: '📅' },
  { path: '/timeline', icon: '🕒' },
  { path: '/game', icon: '🎮' },
  { path: '/stats', icon: '📊' },
  { path: '/settings', icon: '⚙' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useUIContext();

  useEffect(() => {
    const matched = tabs.find((tab) => tab.path === location.pathname);
    if (!matched) return;
    dispatch({ type: 'SET_ACTIVE_TAB', tab: matched.path });
  }, [dispatch, location.pathname]);

  const goTab = (path: UIActiveTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab: path });
    navigate({ pathname: path, search: '' });
  };

  return (
    <nav>
      {tabs.map((tab) => (
        <button
          key={tab.path}
          data-tab={tab.path}
          aria-selected={location.pathname === tab.path}
          className={location.pathname === tab.path ? 'is-active' : ''}
          onClick={() => goTab(tab.path)}
        >
          {tab.icon}
        </button>
      ))}
    </nav>
  );
}

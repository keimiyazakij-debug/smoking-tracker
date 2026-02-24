import { useLocation, useNavigate } from 'react-router-dom';

const tabs: Array<{ path: string; icon: string }> = [
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
  const goTab = (path: string) => {
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

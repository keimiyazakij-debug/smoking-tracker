import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MainPage } from './pages/MainPage';
import { CalendarPage } from './pages/CalendarPage';
import { TimelinePage } from './pages/TimelinePage';
import { StatsPage } from './pages/StatsPage';
import { GameBadgesPage, GameChallengePage, GamePage } from './pages/GamePage';
import { SettingsPage } from './pages/SettingsPage';
import { AppProvider } from './state/AppContext';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <BottomNav />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/main" />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/game/challenge" element={<GameChallengePage />} />
        <Route path="/game/badges" element={<GameBadgesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/main" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

type RouterCtx = {
  pathname: string;
  navigate: (to: string) => void;
};

const Ctx = createContext<RouterCtx | null>(null);

export function AppRouter({ children }: PropsWithChildren) {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === pathname) return;
    window.history.pushState({}, '', to);
    setPathname(to);
  };

  const value = useMemo(() => ({ pathname, navigate }), [pathname]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNavigate() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNavigate must be used inside AppRouter');
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocation must be used inside AppRouter');
  return { pathname: ctx.pathname };
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return null;
}

export function Route(_props: { path: string; element: ReactNode }) {
  return null;
}

type RouteElement = ReactElement<{ path: string; element: ReactNode }>;

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const all = Array.isArray(children) ? children : [children];
  const routeElements = all.filter(Boolean) as RouteElement[];

  for (const node of routeElements) {
    const path = node.props.path as string;
    if (path === pathname) return <>{node.props.element}</>;
  }

  const fallback = routeElements.find((node) => node.props.path === '*');
  return <>{fallback?.props.element ?? null}</>;
}

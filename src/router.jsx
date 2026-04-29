import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const RouterContext = createContext({ path: '/', navigate: () => {} });

function trackPage(path) {
  window.mixpanel?.track('Page View', { page: path });
}

export function Router({ children }) {
  const [path, setPath] = useState(() => window.location.pathname);

  // page view בטעינה ראשונה
  useEffect(() => { trackPage(window.location.pathname); }, []);

  useEffect(() => {
    const handler = () => {
      const p = window.location.pathname;
      setPath(p);
      trackPage(p);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState(null, '', to);
    setPath(to);
    trackPage(to);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

import { useCallback, useEffect, useState } from 'react';
import type { Route } from '@/types';
import { ROUTES } from '@/constants';

function parseRoute(): Route {
  const hash = window.location.hash.replace('#', '');
  return (ROUTES as string[]).includes(hash) ? (hash as Route) : 'home';
}

/** URL 해시(#estimate 등)를 현재 라우트로 관리하는 최소 라우터 훅. */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRouteState] = useState<Route>(parseRoute);

  useEffect(() => {
    const onHashChange = () => setRouteState(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '#home';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = `#${next}`;
  }, []);

  return [route, navigate];
}

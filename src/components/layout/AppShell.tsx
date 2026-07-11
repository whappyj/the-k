import type { ReactNode } from 'react';
import type { Route } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

interface AppShellProps {
  route: Route;
  onNavigate: (route: Route) => void;
  children: ReactNode;
}

export function AppShell({ route, onNavigate, children }: AppShellProps) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 min-[900px]:grid-cols-[260px_1fr] min-[1920px]:max-w-[1880px] min-[2560px]:max-w-[2320px]">
      <Sidebar route={route} onNavigate={onNavigate} />
      <main className="w-full max-w-[1320px] px-4 pb-16 min-[900px]:px-10 min-[900px]:pb-20 min-[1920px]:max-w-[1600px] min-[1920px]:px-14 min-[2560px]:max-w-[1980px] min-[2560px]:px-20">
        <TopBar route={route} />
        {children}
      </main>
    </div>
  );
}

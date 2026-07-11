import { Home, Coins, Swords, BarChart3, CalendarClock, Wallet, Settings as SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Route } from '@/types';
import { ROUTE_LABEL, APP_VERSION } from '@/constants';
import { useAppData } from '@/hooks/useAppData';
import { cn } from '@/utils/cn';

const NAV_ITEMS: { route: Route; icon: LucideIcon }[] = [
  { route: 'home', icon: Home },
  { route: 'estimate', icon: Coins },
  { route: 'experience', icon: Swords },
  { route: 'analysis', icon: BarChart3 },
  { route: 'calculator', icon: CalendarClock },
  { route: 'adenaPurchase', icon: Wallet },
];

interface SidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
}

export function Sidebar({ route, onNavigate }: SidebarProps) {
  const { lastSavedLabel } = useAppData();

  return (
    <aside
      className={cn(
        'flex w-full flex-row items-center gap-1 overflow-x-auto border-b border-border/[0.08] bg-sidebar px-3 py-2.5',
        'min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-screen min-[900px]:w-[260px] min-[900px]:shrink-0 min-[900px]:flex-col',
        'min-[900px]:items-stretch min-[900px]:overflow-visible min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-4 min-[900px]:py-6'
      )}
    >
      <div className="mb-0 flex shrink-0 items-center gap-2.5 pr-3 min-[900px]:mb-7 min-[900px]:px-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-[#6d4ef0] font-display text-[15px] font-bold text-white">
          K
        </div>
        <div className="hidden text-base font-bold tracking-tight min-[900px]:block">THE K</div>
      </div>

      <nav className="flex shrink-0 flex-row items-center gap-0.5 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:items-stretch">
        {NAV_ITEMS.map(({ route: r, icon: Icon }) => (
          <SidebarLink key={r} active={route === r} onClick={() => onNavigate(r)}>
            <Icon size={24} />
            <span>{ROUTE_LABEL[r]}</span>
          </SidebarLink>
        ))}
      </nav>

      <div className="flex shrink-0 items-center min-[900px]:block">
        <div className="hidden px-3 pb-2 pt-4 text-[11px] font-bold tracking-wide text-text-faint min-[900px]:block">시스템</div>
        <div className="ml-1 flex shrink-0 flex-row items-center gap-0.5 border-l border-border/[0.08] pl-2 min-[900px]:ml-0 min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:border-l-0 min-[900px]:border-t min-[900px]:pl-0 min-[900px]:pt-2">
          <SidebarLink active={route === 'settings'} onClick={() => onNavigate('settings')}>
            <SettingsIcon size={24} />
            <span>설정</span>
          </SidebarLink>
        </div>
      </div>

      <div className="hidden px-3 pt-3.5 text-[11px] text-text-faint min-[900px]:block">
        {lastSavedLabel}
        <div className="mt-1 opacity-60">THE K v{APP_VERSION}</div>
      </div>
    </aside>
  );
}

function SidebarLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 text-base font-medium text-text-sub transition-colors duration-200',
        'hover:bg-white/[0.05] hover:text-text',
        active && 'bg-primary-dim text-white hover:bg-primary-dim hover:text-white'
      )}
    >
      {active && <span className="absolute -left-4 top-2 bottom-2 hidden w-[3px] rounded-full bg-primary min-[900px]:block" />}
      {children}
    </button>
  );
}

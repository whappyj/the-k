import { Home, Coins, Swords, ListChecks, BarChart3, TrendingUp, Wallet, Settings as SettingsIcon, Scale, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Route } from '@/types';
import { ROUTE_LABEL, APP_VERSION } from '@/constants';
import { useAppData } from '@/hooks/useAppData';
import { cn } from '@/utils/cn';

const TOP_ITEMS: { route: Route; icon: LucideIcon }[] = [
  { route: 'home', icon: Home },
  { route: 'estimate', icon: Coins },
];

const EXPERIENCE_GROUP: { route: Route; icon: LucideIcon }[] = [
  { route: 'experience', icon: Swords },
  { route: 'analysis', icon: ListChecks },
  { route: 'compare', icon: Scale },
  { route: 'huntAreaEfficiency', icon: MapPin },
  { route: 'statistics', icon: BarChart3 },
  { route: 'calculator', icon: TrendingUp },
];

const BOTTOM_ITEMS: { route: Route; icon: LucideIcon }[] = [{ route: 'adenaPurchase', icon: Wallet }];

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
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="mb-0 flex shrink-0 items-center gap-3 rounded-2xl border border-transparent pr-3 text-left transition-colors min-[900px]:mb-6 min-[900px]:w-full min-[900px]:border-border/[0.06] min-[900px]:bg-white/[0.025] min-[900px]:px-3 min-[900px]:py-3 min-[900px]:pr-3 min-[900px]:hover:bg-white/[0.04]"
        aria-label="홈으로 이동"
      >
        <img src="/logo.png" alt="THE K" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />
        <div className="hidden min-[900px]:flex min-[900px]:flex-col min-[900px]:justify-center">
          <div className="text-base font-bold leading-tight tracking-tight text-white">THE K</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-widest text-primary/70">리니지 클래식 도우미</div>
        </div>
      </button>

      <nav className="flex shrink-0 flex-row items-center gap-0.5 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:items-stretch">
        {TOP_ITEMS.map(({ route: r, icon: Icon }) => (
          <SidebarLink key={r} active={route === r} onClick={() => onNavigate(r)}>
            <Icon size={24} />
            <span>{ROUTE_LABEL[r]}</span>
          </SidebarLink>
        ))}

        <div className="hidden px-3 pb-1.5 pt-4 text-[11px] font-bold tracking-wide text-text-faint min-[900px]:block">경험치</div>
        {EXPERIENCE_GROUP.map(({ route: r, icon: Icon }) => (
          <SidebarLink key={r} active={route === r} onClick={() => onNavigate(r)} indent>
            <Icon size={20} />
            <span>{ROUTE_LABEL[r]}</span>
          </SidebarLink>
        ))}

        <div className="min-[900px]:mt-4">
          {BOTTOM_ITEMS.map(({ route: r, icon: Icon }) => (
            <SidebarLink key={r} active={route === r} onClick={() => onNavigate(r)}>
              <Icon size={24} />
              <span>{ROUTE_LABEL[r]}</span>
            </SidebarLink>
          ))}
        </div>
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
  indent,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-11 shrink-0 items-center gap-4 whitespace-nowrap rounded-xl px-3 text-base font-medium text-text-sub transition-colors duration-200',
        'hover:bg-white/[0.05] hover:text-text',
        indent && 'min-[900px]:ml-2 min-[900px]:h-10 min-[900px]:pl-3 min-[900px]:text-[14px]',
        active && 'bg-primary-dim text-primary hover:bg-primary-dim hover:text-primary'
      )}
    >
      {active && <span className="absolute -left-4 top-2 bottom-2 hidden w-[3px] rounded-full bg-primary min-[900px]:block" />}
      {children}
    </button>
  );
}

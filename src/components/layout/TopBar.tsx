import { useEffect, useState } from 'react';
import type { Route } from '@/types';
import { ROUTE_LABEL } from '@/constants';
import { useAppData } from '@/hooks/useAppData';
import { cn } from '@/utils/cn';

export function TopBar({ route }: { route: Route }) {
  const [scrolled, setScrolled] = useState(false);
  const { lastSavedLabel } = useAppData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'sticky top-0 z-[60] -mx-4 flex h-header items-center justify-between border-b border-transparent px-4 transition-colors duration-200 min-[900px]:-mx-10 min-[900px]:px-10 min-[1920px]:-mx-14 min-[1920px]:px-14 min-[2560px]:-mx-20 min-[2560px]:px-20',
        scrolled && 'border-border/[0.08] bg-card/72 backdrop-blur-glass'
      )}
    >
      <div className="text-[15px] font-bold text-text-sub">{ROUTE_LABEL[route]}</div>
      <div className="text-xs text-text-faint">{lastSavedLabel}</div>
    </div>
  );
}

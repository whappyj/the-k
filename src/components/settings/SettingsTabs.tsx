import { useState } from 'react';
import type { ReactNode } from 'react';
import { Settings as SettingsIcon, GitCompareArrows, Layers, Grid3X3, MonitorCog, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SettingsTab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

const ICONS = { SettingsIcon, GitCompareArrows, Layers, Grid3X3, MonitorCog, Database };
export { ICONS as SettingsTabIcons };

/**
 * components/settings/SettingsTabs.tsx
 * 설정 페이지 전용 탭 전환 UI. 좌측 세로 메뉴 + 우측 콘텐츠 2단 구성.
 * 순수 UI 상태(선택된 탭)만 다루며 앱 데이터/저장 로직과는 무관하다.
 */
export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6 max-[860px]:grid-cols-1">
      <nav className="flex flex-col gap-1 rounded-2xl border border-[#1D2530] bg-[#0B1016] p-1.5 max-[860px]:flex-row max-[860px]:overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === current?.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]',
                isActive ? 'bg-gold/[0.14] text-gold' : 'text-[#9AA1AC] hover:bg-white/[0.05] hover:text-white'
              )}
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </nav>
      <div key={current?.id} className="animate-fade-in min-w-0">
        {current?.content}
      </div>
    </div>
  );
}

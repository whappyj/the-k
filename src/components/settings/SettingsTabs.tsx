import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SettingsTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * components/settings/SettingsTabs.tsx
 * 설정 페이지 전용 탭 전환 UI. 순수 UI 상태(선택된 탭)만 다루며 앱 데이터/저장 로직과는 무관하다.
 */
export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-7 flex gap-1 overflow-x-auto rounded-2xl border border-[#2A2F38] bg-[#171A20] p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200',
              t.id === current?.id ? 'bg-primary text-white shadow-[0_2px_10px_rgba(79,140,255,0.35)]' : 'text-[#8A93A3] hover:bg-white/[0.04] hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={current?.id} className="animate-fade-in">
        {current?.content}
      </div>
    </div>
  );
}

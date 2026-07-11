import type { ReactNode } from 'react';
import type { EstimateMaterial } from '@/types';
import { cn } from '@/utils/cn';

interface EstimateHeroProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
}

/** 1만원 이상이면 "14만"처럼 축약, 미만이면 콤마 표기. */
function formatMan(n: number): string {
  if (!n) return '0';
  if (Math.abs(n) >= 10000) {
    const man = Math.round((n / 10000) * 10) / 10;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return n.toLocaleString('ko-KR');
}

/**
 * components/estimate/EstimateHero.tsx
 * 제작 견적 화면 최상단 Hero. 대표(첫 번째) 재료의 A/B 가격과 아데나 환율 A/B를
 * 방송에서도 한눈에 보이도록 가장 크게 보여준다. 계산/저장 로직은 전혀 건드리지 않는다.
 */
export function EstimateHero({ materials, rateA, rateB }: EstimateHeroProps) {
  const repMaterial = materials[0] ?? null;

  return (
    <div className="grid grid-cols-1 divide-y divide-[#2A2D35] rounded-[20px] border border-[#2A2D35] bg-[#1B1D22] min-[860px]:grid-cols-2 min-[860px]:divide-x min-[860px]:divide-y-0">
      <HeroColumn label={repMaterial ? repMaterial.name : '대표 재료'} unit="">
        <HeroValue tone="primary" value={repMaterial ? formatMan(repMaterial.priceA) : '0'} />
        <HeroValue tone="warning" value={repMaterial ? formatMan(repMaterial.priceB) : '0'} />
      </HeroColumn>

      <HeroColumn label="아데나 환율" unit="원">
        <HeroValue tone="primary" value={rateA.toLocaleString('ko-KR')} suffix="원" />
        <HeroValue tone="warning" value={rateB.toLocaleString('ko-KR')} suffix="원" />
      </HeroColumn>
    </div>
  );
}

function HeroColumn({ label, children }: { label: string; unit: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 p-8 sm:p-10">
      <div className="text-[13px] font-semibold uppercase tracking-wide text-[#8A8F9C]">{label}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function HeroValue({ value, tone, suffix }: { value: string; tone: 'primary' | 'warning'; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span
        className={cn(
          'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
          tone === 'primary' ? 'bg-primary' : 'bg-warning'
        )}
      />
      <div className="font-display text-[56px] font-bold leading-none tracking-tight text-white sm:text-[76px]">
        {value}
        {suffix && <span className="ml-2 text-2xl font-semibold text-[#8A8F9C] sm:text-3xl">{suffix}</span>}
      </div>
    </div>
  );
}

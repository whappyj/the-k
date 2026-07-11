import type { EstimateMaterial } from '@/types';

interface EstimateConditionBarProps {
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
 * components/estimate/EstimateConditionBar.tsx
 * "조건 → 결과 → 상세" 흐름의 첫 단계. A/B 각각 아데나 시세와 핵심재료 가격,
 * 이 네 개 숫자만 가장 먼저 보여준다. 핵심재료는 재료 목록의 첫 번째 항목이며
 * (재료 변경에서 ★로 맨 앞으로 옮길 수 있다), 계산/저장 로직은 전혀 건드리지 않는다.
 */
export function EstimateConditionBar({ materials, rateA, rateB }: EstimateConditionBarProps) {
  const keyMaterial = materials[0] ?? null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <ConditionColumn label="A" tone="primary" rate={rateA} keyPrice={keyMaterial ? formatMan(keyMaterial.priceA) : '0'} materialName={keyMaterial?.name} />
      <ConditionColumn label="B" tone="warning" rate={rateB} keyPrice={keyMaterial ? formatMan(keyMaterial.priceB) : '0'} materialName={keyMaterial?.name} />
    </div>
  );
}

function ConditionColumn({
  label,
  tone,
  rate,
  keyPrice,
  materialName,
}: {
  label: string;
  tone: 'primary' | 'warning';
  rate: number;
  keyPrice: string;
  materialName?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2A2F38] bg-[#171A20] p-6 transition-colors duration-200 hover:border-[#3A3F4A] sm:p-7">
      <div className="mb-5 flex items-center gap-2">
        <span
          className={
            'inline-flex h-6 w-6 items-center justify-center rounded-lg font-display text-[12px] font-bold ' +
            (tone === 'primary' ? 'bg-primary-dim text-primary' : 'bg-warning-dim text-warning')
          }
        >
          {label}
        </span>
        <span className="text-[13px] font-semibold text-[#8A93A3]">조건 {label}</span>
      </div>

      <div className="mb-5">
        <div className="text-[11px] font-medium text-[#8A93A3]">아데나 시세</div>
        <div className="mt-1 font-display text-[32px] font-bold leading-none tracking-tight text-white sm:text-[38px]">
          {rate.toLocaleString('ko-KR')}
          <span className="ml-1.5 text-base font-semibold text-[#8A93A3]">원</span>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-medium text-[#8A93A3]">핵심재료 가격{materialName ? ` · ${materialName}` : ''}</div>
        <div className="mt-1 font-display text-[32px] font-bold leading-none tracking-tight text-white sm:text-[38px]">{keyPrice}</div>
      </div>
    </div>
  );
}

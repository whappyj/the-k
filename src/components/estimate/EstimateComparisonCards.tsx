import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EstimateMaterial } from '@/types';
import { calcEstimateGroup } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/utils/cn';

interface EstimateComparisonCardsProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  qtyTier: number;
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
 * components/estimate/EstimateComparisonCards.tsx
 * "조건 → 결과 → 상세" 흐름의 결과 단계. 좌(A)/VS/우(B) 카드 2개만 보여주고, 각 카드에는
 * 제작비(원화)만 크게 표시한다. 카드 제목은 대표(첫 번째) 재료명 + 가격을 자동 생성한다.
 * 두 카드 아래에는 차이를 3초 안에 판단할 수 있도록 크게 강조한다. 상세 재료는 기본 숨김,
 * "상세 보기"를 눌렀을 때만 펼쳐진다. calcEstimateGroup()만 재사용하며 계산식은 그대로다.
 */
export function EstimateComparisonCards({ materials, rateA, rateB, feeA, feeB, qtyTier }: EstimateComparisonCardsProps) {
  const { formatNumber } = useFormatters();
  const [detailOpen, setDetailOpen] = useState(false);
  const repMaterial = materials[0] ?? null;

  const resA = calcEstimateGroup(materials, 'priceA', rateA, feeA, qtyTier);
  const resB = calcEstimateGroup(materials, 'priceB', rateB, feeB, qtyTier);

  const titleA = repMaterial ? `${repMaterial.name} ${formatMan(repMaterial.priceA)}` : '조건 A';
  const titleB = repMaterial ? `${repMaterial.name} ${formatMan(repMaterial.priceB)}` : '조건 B';

  const diff = resB.krw - resA.krw;
  const cheaper: 'A' | 'B' | null = diff === 0 ? null : diff > 0 ? 'A' : 'B';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 max-[640px]:grid-cols-1">
        <PriceCard title={titleA} badge="A" tone="primary" krw={resA.krw} highlight={cheaper === 'A'} formatNumber={formatNumber} />

        <div className="flex items-center justify-center px-1 max-[640px]:py-1">
          <span className="font-display text-[13px] font-bold tracking-wide text-[#8A93A3]">VS</span>
        </div>

        <PriceCard title={titleB} badge="B" tone="warning" krw={resB.krw} highlight={cheaper === 'B'} formatNumber={formatNumber} />
      </div>

      <DiffBanner diff={diff} formatNumber={formatNumber} />

      <div>
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F38] bg-[#171A20] px-4 py-2.5 text-[13px] font-semibold text-[#8A93A3] transition-colors hover:text-white"
        >
          상세 보기 {detailOpen ? '접기' : '펼치기'}
          {detailOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {detailOpen && (
          <div className="mt-4 flex flex-col rounded-2xl border border-[#2A2F38] bg-[#171A20] p-2">
            <div className="flex items-center px-3 pb-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A93A3]">
              <span className="flex-1">재료명</span>
              <span className="w-[90px] text-right">A 가격</span>
              <span className="w-[90px] text-right">B 가격</span>
              <span className="w-[90px] text-right">차이</span>
            </div>
            <div className="flex flex-col divide-y divide-[#2A2F38]">
              {materials.map((m) => {
                const a = resA.rows.find((r) => r.id === m.id)!;
                const b = resB.rows.find((r) => r.id === m.id)!;
                const rowDiff = b.cost - a.cost;
                return (
                  <div key={m.id} className="flex items-center px-3 py-3 text-[13px]">
                    <span className="flex-1 truncate pr-2 font-medium text-white">{m.name}</span>
                    <span className="w-[90px] text-right text-[#8A93A3]">{formatNumber(a.cost)}</span>
                    <span className="w-[90px] text-right text-[#8A93A3]">{formatNumber(b.cost)}</span>
                    <span className={cn('w-[90px] text-right font-semibold', rowDiff > 0 && 'text-warning', rowDiff < 0 && 'text-success', rowDiff === 0 && 'text-[#8A93A3]')}>
                      {rowDiff === 0 ? '-' : `${rowDiff > 0 ? '+' : ''}${formatNumber(rowDiff)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceCard({
  title,
  badge,
  tone,
  krw,
  highlight,
  formatNumber,
}: {
  title: string;
  badge: 'A' | 'B';
  tone: 'primary' | 'warning';
  krw: number;
  highlight: boolean;
  formatNumber: (n: number) => string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border bg-[#171A20] p-6 text-center sm:p-7',
        highlight ? 'border-success/50 ring-1 ring-success/30' : 'border-[#2A2F38]'
      )}
    >
      <div className="mb-4 flex items-center justify-center gap-2">
        <span
          className={cn(
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-bold',
            tone === 'primary' ? 'bg-primary-dim text-primary' : 'bg-warning-dim text-warning'
          )}
        >
          {badge}
        </span>
        <span className="truncate text-[13px] font-semibold text-[#8A93A3]">{title}</span>
      </div>
      <div className="text-[11px] font-medium tracking-wide text-[#8A93A3]">제작비</div>
      <div className="mt-1 font-display text-[32px] font-bold leading-none tracking-tight text-white sm:text-[40px]">
        {formatNumber(krw)}
        <span className="ml-1.5 text-base font-medium text-[#8A93A3]">원</span>
      </div>
    </div>
  );
}

function DiffBanner({ diff, formatNumber }: { diff: number; formatNumber: (n: number) => string }) {
  if (diff === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[#2A2F38] bg-[#171A20] py-5">
        <span className="text-[15px] font-bold text-[#8A93A3]">차이 없음</span>
      </div>
    );
  }

  const bCheaper = diff < 0;
  const amount = Math.abs(diff);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-2xl border py-6',
        bCheaper ? 'border-success/40 bg-success/[0.08]' : 'border-warning/40 bg-warning/[0.08]'
      )}
    >
      <span className={cn('font-display text-[30px] font-bold leading-none tracking-tight sm:text-[36px]', bCheaper ? 'text-success' : 'text-warning')}>
        {bCheaper ? `▼ ${formatNumber(amount)}원 절약` : `+${formatNumber(amount)}원`}
      </span>
      <span className="text-[12px] text-[#8A93A3]">{bCheaper ? 'B가 A보다 저렴합니다' : 'B가 A보다 비쌉니다'}</span>
    </div>
  );
}

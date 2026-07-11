import type { EstimateMaterial } from '@/types';
import { calcEstimateGroup } from '@/lib/calculations';
import { QTY_TIERS } from '@/constants';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/utils/cn';

interface EstimateResultTableProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
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
 * components/estimate/EstimateResultTable.tsx
 * "13만 1개 / 13만 3개 / 13만 5개 / 14만 1개 ..." 처럼 카드가 반복되던 결과 화면을
 * 그룹(A/B) × 수량(1/3/5개) 표로 정리한다. 각 셀은 calcEstimateGroup()을 그대로 호출해
 * 얻은 필요 아데나(totalAdena)를 크게, 원화(krw)를 작게 보여준다 — 계산식은 기존 그대로다.
 * 판매가(단가)는 이 표에 표시하지 않는다.
 */
export function EstimateResultTable({ materials, rateA, rateB, feeA, feeB }: EstimateResultTableProps) {
  const { formatNumber } = useFormatters();
  const repMaterial = materials[0] ?? null;

  const groups = [
    { key: 'A' as const, label: repMaterial ? formatMan(repMaterial.priceA) : 'A', tone: 'primary' as const, priceKey: 'priceA' as const, rate: rateA, fee: feeA },
    { key: 'B' as const, label: repMaterial ? formatMan(repMaterial.priceB) : 'B', tone: 'warning' as const, priceKey: 'priceB' as const, rate: rateB, fee: feeB },
  ];

  return (
    <div className="overflow-x-auto rounded-[20px] border border-[#2A2D35] bg-[#1B1D22]">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            <th className="w-[120px] border-b border-[#2A2D35] px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-wide text-[#8A8F9C]">
              필요 아데나
            </th>
            {QTY_TIERS.map((tier) => (
              <th key={tier} className="border-b border-[#2A2D35] px-6 py-4 text-center text-[13px] font-bold text-white">
                {tier}개
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g, gi) => (
            <tr key={g.key} className={cn(gi !== groups.length - 1 && 'border-b border-[#2A2D35]')}>
              <td className="px-6 py-6 align-middle">
                <span className="inline-flex items-center gap-2 font-display text-lg font-bold text-white">
                  <span className={cn('inline-block h-2 w-2 rounded-full', g.tone === 'primary' ? 'bg-primary' : 'bg-warning')} />
                  {g.label}
                </span>
              </td>
              {QTY_TIERS.map((tier) => {
                const res = calcEstimateGroup(materials, g.priceKey, g.rate, g.fee, tier);
                return (
                  <td key={tier} className="px-6 py-6 text-center align-middle">
                    <div className="font-display text-[26px] font-bold leading-tight text-white sm:text-[32px]">
                      {formatNumber(res.totalAdena)}
                    </div>
                    <div className="mt-1 text-[13px] text-[#8A8F9C]">{formatNumber(res.krw)}원</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

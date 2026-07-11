import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EstimateMaterial } from '@/types';
import { calcEstimateGroup } from '@/lib/calculations';
import { QTY_TIERS } from '@/constants';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/utils/cn';

interface EstimateMatrixTableProps {
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
 * 환율(A/B) × 핵심재료 가격(A/B) 조합의 "필요 아데나"를 실제 원화 제작비용으로 환산한다.
 * 이 화면의 환율은 "1만 아데나 기준" 단가이므로 (필요 아데나 ÷ 10,000) × 환율이 올바른 계산이다.
 * calcEstimateGroup()의 반환값(totalAdena)만 그대로 사용해 여기서 "표시용"으로만 재환산하며,
 * calculations.ts의 계산식 자체는 전혀 건드리지 않는다.
 */
function toKrw(totalAdena: number, rate: number): number {
  return (totalAdena / 10000) * rate;
}

interface SelectedBlock {
  rateLabel: string;
  rate: number;
  priceKey: 'priceA' | 'priceB';
  priceLabel: string;
  fee: number;
}

/**
 * components/estimate/EstimateMatrixTable.tsx
 * 환율(A/B) × 핵심재료 가격(A/B) 2x2 조합마다 1개/3개/5개 결과를 미니 표로 보여준다.
 * 카드를 클릭하면 그 카드 바로 아래에 재료 상세(재료명/필요수량/개당가격/재료비/총재료비/제작비용)가
 * 펼쳐진다(모달 없음). calcEstimateGroup()만 그대로 재사용하며 계산식은 전혀 바뀌지 않는다.
 */
export function EstimateMatrixTable({ materials, rateA, rateB, feeA, feeB }: EstimateMatrixTableProps) {
  const { formatNumber } = useFormatters();
  const [selected, setSelected] = useState<SelectedBlock | null>(null);
  const [detailTier, setDetailTier] = useState<1 | 3 | 5>(1);
  const keyMaterial = materials[0] ?? null;

  const rateGroups = [
    { label: `환율 ${rateA.toLocaleString('ko-KR')}원`, rate: rateA },
    { label: `환율 ${rateB.toLocaleString('ko-KR')}원`, rate: rateB },
  ];
  const priceGroups: { priceKey: 'priceA' | 'priceB'; fee: number }[] = [
    { priceKey: 'priceA', fee: feeA },
    { priceKey: 'priceB', fee: feeB },
  ];

  const detailResult = selected ? calcEstimateGroup(materials, selected.priceKey, selected.rate, selected.fee, detailTier) : null;

  const isSameBlock = (rate: number, priceKey: 'priceA' | 'priceB') => selected?.rate === rate && selected?.priceKey === priceKey;

  return (
    <div className="flex flex-col gap-5">
      {rateGroups.map((rg, ri) => (
        <div key={ri} className="rounded-2xl border border-[#2A2F38] bg-[#171A20] p-5 sm:p-6">
          <div className="mb-4 text-[15px] font-bold text-white">
            {rg.label} <span className="text-[13px] font-normal text-[#8A93A3]">(1만 아데나 = {rg.rate.toLocaleString('ko-KR')}원)</span>
          </div>
          <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
            {priceGroups.map((pg) => {
              const priceVal = keyMaterial ? keyMaterial[pg.priceKey] : 0;
              const priceLabel = keyMaterial ? formatMan(priceVal) : '0';
              const isOpen = isSameBlock(rg.rate, pg.priceKey);
              return (
                <div key={pg.priceKey} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOpen) {
                        setSelected(null);
                      } else {
                        setSelected({ rateLabel: rg.label, rate: rg.rate, priceKey: pg.priceKey, priceLabel, fee: pg.fee });
                        setDetailTier(1);
                      }
                    }}
                    className={cn(
                      'rounded-xl border bg-white/[0.02] p-4 text-left transition-colors duration-200 hover:border-primary/40 hover:bg-white/[0.04] active:scale-[0.99]',
                      isOpen ? 'border-primary/50' : 'border-[#2A2F38]'
                    )}
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-white">
                        {keyMaterial?.name ?? '핵심재료'} {priceLabel}원
                      </span>
                      {isOpen ? <ChevronUp size={15} className="shrink-0 text-primary" /> : <ChevronDown size={15} className="shrink-0 text-[#8A93A3]" />}
                    </div>
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="text-[#8A93A3]">
                          <th className="pb-1.5 text-left font-medium">제작 수량</th>
                          <th className="pb-1.5 text-right font-medium">필요 아데나</th>
                          <th className="pb-1.5 text-right font-medium">제작비용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {QTY_TIERS.map((tier) => {
                          const res = calcEstimateGroup(materials, pg.priceKey, rg.rate, pg.fee, tier);
                          return (
                            <tr key={tier} className="border-t border-[#2A2F38]/60">
                              <td className="py-1.5 text-[#8A93A3]">{tier}개 제작</td>
                              <td className="py-1.5 text-right text-white">{formatNumber(res.totalAdena)}</td>
                              <td className="py-1.5 text-right font-semibold text-primary">{formatNumber(toKrw(res.totalAdena, rg.rate))}원</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </button>

                  {isOpen && detailResult && (
                    <div className="mt-2 rounded-xl border border-primary/30 bg-white/[0.02] p-4">
                      <div className="mb-3 flex gap-1.5">
                        {QTY_TIERS.map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setDetailTier(tier)}
                            className={cn(
                              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                              detailTier === tier ? 'bg-primary text-white' : 'bg-white/[0.05] text-text-sub hover:text-text'
                            )}
                          >
                            {tier}개
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
                        <span className="flex-1">재료명</span>
                        <span className="w-[70px] text-right">필요수량</span>
                        <span className="w-[90px] text-right">개당가격</span>
                        <span className="w-[100px] text-right">재료비</span>
                      </div>
                      <div className="flex flex-col divide-y divide-border/[0.07]">
                        {detailResult.rows.map((r) => (
                          <div key={r.id} className="flex items-center px-1 py-2 text-[13px]">
                            <span className="flex-1 truncate pr-2 font-medium text-text">{r.name}</span>
                            <span className="w-[70px] text-right text-text-sub">{formatNumber(r.neededQty)}</span>
                            <span className="w-[90px] text-right text-text-sub">{formatNumber(r.unitPrice)}</span>
                            <span className="w-[100px] text-right font-display font-bold text-text">{formatNumber(r.cost)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-border/[0.08] bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-text-sub">총 재료비</span>
                          <span className="font-display font-bold text-text">{formatNumber(detailResult.materialTotal)} 아데나</span>
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-text-sub">제작비용</span>
                          <span className="font-display text-base font-bold text-primary">{formatNumber(toKrw(detailResult.totalAdena, rg.rate))}원</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {keyMaterial && (
        <div className="rounded-2xl border border-[#2A2F38] bg-[#171A20] p-5 sm:p-6">
          <div className="mb-4 text-[15px] font-bold text-white">재료 소모량 (개당 기준)</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[13px]">
              <thead>
                <tr className="text-[#8A93A3]">
                  <th className="border-b border-[#2A2F38] px-2 py-2 text-left font-medium">재료명</th>
                  {QTY_TIERS.map((tier) => (
                    <th key={tier} className="border-b border-[#2A2F38] px-2 py-2 text-right font-medium">
                      {tier}개 제작 시
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id} className="border-b border-[#2A2F38]/60 last:border-none">
                    <td className="px-2 py-2 text-white">{m.name}</td>
                    {QTY_TIERS.map((tier) => (
                      <td key={tier} className="px-2 py-2 text-right text-[#8A93A3]">
                        {formatNumber((Number(m.qty) || 0) * tier)}개
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
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

interface Combo {
  key: string;
  rateLabel: string;
  rate: number;
  priceKey: 'priceA' | 'priceB';
  priceLabel: string;
  fee: number;
}

/**
 * components/estimate/EstimateMatrixTable.tsx
 * 환율(A/B) × 핵심재료 가격(A/B) 4개 조합을 "하나의 통합 비교표"로 보여준다 — 이전에는 조합마다
 * 별도 카드+미니표가 4번 반복돼 최저가를 알아보려면 카드를 일일이 열어봐야 했다. 지금은 제작
 * 수량(1/3/5개)을 행, 4개 조합을 열로 둔 표 하나에서 바로 비교되고, 행마다 최저가 셀에 강조
 * 배지를 붙인다. calcEstimateGroup()의 계산 호출과 반환값은 이전과 완전히 동일하게 그대로
 * 재사용하며, 표시 구조만 재구성했다 — 계산식은 전혀 바뀌지 않는다.
 */
export function EstimateMatrixTable({ materials, rateA, rateB, feeA, feeB }: EstimateMatrixTableProps) {
  const { formatNumber } = useFormatters();
  const keyMaterial = materials[0] ?? null;

  const combos: Combo[] = [
    { key: 'A-A', rateLabel: `환율 ${rateA.toLocaleString('ko-KR')}원`, rate: rateA, priceKey: 'priceA', priceLabel: keyMaterial ? formatMan(keyMaterial.priceA) : '0', fee: feeA },
    { key: 'A-B', rateLabel: `환율 ${rateA.toLocaleString('ko-KR')}원`, rate: rateA, priceKey: 'priceB', priceLabel: keyMaterial ? formatMan(keyMaterial.priceB) : '0', fee: feeB },
    { key: 'B-A', rateLabel: `환율 ${rateB.toLocaleString('ko-KR')}원`, rate: rateB, priceKey: 'priceA', priceLabel: keyMaterial ? formatMan(keyMaterial.priceA) : '0', fee: feeA },
    { key: 'B-B', rateLabel: `환율 ${rateB.toLocaleString('ko-KR')}원`, rate: rateB, priceKey: 'priceB', priceLabel: keyMaterial ? formatMan(keyMaterial.priceB) : '0', fee: feeB },
  ];

  const [selectedKey, setSelectedKey] = useState<string>(combos[0]?.key ?? 'A-A');
  const [detailTier, setDetailTier] = useState<1 | 3 | 5>(1);
  const selected = combos.find((c) => c.key === selectedKey) ?? combos[0] ?? null;
  const detailResult = selected ? calcEstimateGroup(materials, selected.priceKey, selected.rate, selected.fee, detailTier) : null;

  // 행(수량 tier)마다 4개 조합의 결과를 미리 계산 — 최저가 판별에 사용.
  const rows = QTY_TIERS.map((tier) => {
    const cells = combos.map((c) => {
      const res = calcEstimateGroup(materials, c.priceKey, c.rate, c.fee, tier);
      return { combo: c, totalAdena: res.totalAdena, krw: toKrw(res.totalAdena, c.rate) };
    });
    const minKrw = Math.min(...cells.map((c) => c.krw));
    return { tier, cells, minKrw };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#1D2530] bg-[#0B1016] p-8">
        <div className="mb-1 text-[17px] font-bold text-white">제작비 비교표</div>
        <div className="mb-6 text-[13px] text-[#9AA1AC]">
          {keyMaterial?.name ?? '핵심재료'} 기준 · 열 헤더를 눌러 조합을 선택하면 아래에 재료 상세가 표시됩니다.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-[#1D2530] text-left text-text-faint">
                <th className="px-4 py-3 text-[12px] font-semibold">제작 수량</th>
                {combos.map((c) => {
                  const isOpen = c.key === selectedKey;
                  return (
                    <th key={c.key} className="px-1.5 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => setSelectedKey(c.key)}
                        className={cn(
                          'flex w-full flex-col gap-3 rounded-xl px-4 py-4 text-left transition-colors duration-200 hover:bg-white/[0.045]',
                          isOpen ? 'bg-primary-dim/50' : 'bg-white/[0.02]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-primary">환율</div>
                            <div className="font-display text-[24px] font-bold leading-tight text-primary">{c.rateLabel.replace('환율 ', '')}</div>
                          </div>
                          {isOpen ? <ChevronUp size={18} className="mt-0.5 shrink-0 text-primary" /> : <ChevronDown size={18} className="mt-0.5 shrink-0 text-primary/50" />}
                        </div>
                        <div className="h-px w-full bg-white/[0.12]" />
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-bold text-gold">{keyMaterial?.name ?? '핵심재료'}</div>
                          <div className="font-display text-[24px] font-bold leading-tight text-gold">{c.priceLabel}원</div>
                        </div>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tier, cells, minKrw }) => (
                <tr key={tier} className="border-b border-[#1D2530] last:border-none">
                  <td className="px-4 py-4 font-semibold text-white">{tier}개 제작</td>
                  {cells.map(({ combo, krw }) => {
                    const isBest = krw === minKrw;
                    const isSelectedCol = combo.key === selectedKey;
                    return (
                      <td key={combo.key} className={cn('px-2 py-4 text-right', isSelectedCol && 'bg-primary-dim/20')}>
                        <div className={cn('font-display text-[16px] font-bold', isBest ? 'text-success' : 'text-white')}>{formatNumber(krw)}원</div>
                        {isBest && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-dim px-2 py-0.5 text-[10px] font-bold text-success">
                            <Trophy size={16} />
                            최저가
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && detailResult && (
        <div className="rounded-2xl border border-primary/30 bg-white/[0.02] p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[15px] font-bold text-white">
              선택한 조합 상세 — {selected.rateLabel} × {keyMaterial?.name ?? '핵심재료'} {selected.priceLabel}원
            </div>
            <div className="flex gap-1.5">
              {QTY_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setDetailTier(tier)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    detailTier === tier ? 'bg-primary text-white' : 'bg-white/[0.05] text-text-sub hover:text-text'
                  )}
                >
                  {tier}개
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
            <span className="flex-1">재료명</span>
            <span className="w-[70px] text-right">필요수량</span>
            <span className="w-[90px] text-right">개당가격</span>
            <span className="w-[100px] text-right">재료비</span>
          </div>
          <div className="flex flex-col divide-y divide-border/[0.07]">
            {detailResult.rows.map((r) => (
              <div key={r.id} className="flex items-start gap-2 px-1 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 break-words pr-2 font-medium text-text">{r.name}</span>
                <span className="w-[70px] shrink-0 text-right text-text-sub">{formatNumber(r.neededQty)}</span>
                <span className="w-[90px] shrink-0 text-right text-text-sub">{formatNumber(r.unitPrice)}</span>
                <span className="w-[100px] shrink-0 text-right font-display font-bold text-text">{formatNumber(r.cost)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-border/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-sub">총 재료비</span>
              <span className="font-display font-bold text-text">{formatNumber(detailResult.materialTotal)} 아데나</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-sub">제작비용</span>
              <span className="font-display text-base font-bold text-primary">{formatNumber(toKrw(detailResult.totalAdena, selected.rate))}원</span>
            </div>
          </div>
        </div>
      )}

      {keyMaterial && (
        <div className="rounded-2xl border border-[#1D2530] bg-[#0B1016] p-8">
          <div className="mb-6 text-[17px] font-bold text-white">재료 소모량 (개당 기준)</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[14px]">
              <thead>
                <tr className="text-[#9AA1AC]">
                  <th className="border-b border-[#1D2530] px-3 py-3 text-left font-medium">재료명</th>
                  {QTY_TIERS.map((tier) => (
                    <th key={tier} className="border-b border-[#1D2530] px-3 py-3 text-right font-medium">
                      {tier}개 제작 시
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id} className="border-b border-[#1D2530]/60 last:border-none">
                    <td className="px-3 py-3 text-white">{m.name}</td>
                    {QTY_TIERS.map((tier) => (
                      <td key={tier} className="px-3 py-3 text-right text-[#9AA1AC]">
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

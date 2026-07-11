import { useState } from 'react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { computeHuntAreaCards } from '@/lib/analysis';
import type { AreaRank } from '@/lib/analysis';
import { Card } from '@/components/ui/card';
import { AreaDetail } from '@/components/analysis/AreaDetail';
import { cn } from '@/utils/cn';

const RANK_BADGE: Record<AreaRank, { icon: string; label: string; className: string } | null> = {
  best: { icon: '🏆', label: '최고 효율', className: 'border-t-warning bg-warning/[0.08]' },
  second: { icon: '🥈', label: '2위', className: 'border-t-text-faint bg-white/[0.03]' },
  worst: { icon: '⚠', label: '현재 최하 효율', className: 'border-t-danger bg-danger/[0.06]' },
  normal: null,
};

const RANK_ORDER = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

/**
 * components/analysis/HuntAreaCompareCards.tsx
 * "새 사냥터가 나오면 어디가 제일 좋은지 3초 안에 판단"하기 위한 카드형 비교 UI.
 * 막대/선/원형 그래프를 전혀 쓰지 않고, 순위는 이모지(🏆/🥈/⚠)와 카드 테두리 색으로만 표시한다.
 * 모든 수치는 "30분 기준 %"로 통일해 사냥터·조합 간 바로 비교 가능하다.
 * 카드를 클릭하면 그 사냥터의 최근 기록 5건을 펼쳐서 볼 수 있다.
 */
export function HuntAreaCompareCards({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const cards = computeHuntAreaCards(records);
  const [openArea, setOpenArea] = useState<string | null>(null);

  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
      {cards.map((card) => {
        const badge = RANK_BADGE[card.rank];
        const open = openArea === card.huntArea;

        return (
          <Card
            key={card.huntArea}
            className={cn('cursor-pointer border-t-[3px] transition-transform', badge?.className)}
            onClick={() => setOpenArea((prev) => (prev === card.huntArea ? null : card.huntArea))}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[16px] font-bold">{card.huntArea}</div>
              {badge && (
                <span className="text-2xl" title={badge.label} aria-label={badge.label}>
                  {badge.icon}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {card.combos.map((combo, i) => (
                <div key={combo.label} className="flex items-center justify-between rounded-xl border border-border/[0.08] bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-faint">{RANK_ORDER[i] ?? `${i + 1}.`}</span>
                    <span className="text-[13px] font-semibold">{combo.label}</span>
                    <span className="text-[11px] text-text-faint">({combo.count}회)</span>
                  </div>
                  <div className="font-display text-[14px] font-bold">
                    30분 <span className={i === 0 ? 'text-primary' : ''}>{formatPercent(combo.per30min)}</span>
                  </div>
                </div>
              ))}
            </div>

            {badge && (
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2 text-[13px] font-bold">
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
                {card.rank === 'best' && card.diffFromNext !== null && <span className="text-success">(+{card.diffFromNext.toFixed(1)}%)</span>}
              </div>
            )}

            {open && (
              <div onClick={(e) => e.stopPropagation()}>
                <AreaDetail area={card.huntArea} records={records} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

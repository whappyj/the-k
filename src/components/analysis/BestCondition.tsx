import { Star, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { groupBy, sortGroups, computeStats } from '@/lib/analysis';
import { computeTrend } from '@/lib/expVelocity';
import { MIN_RECOMMEND_COUNT } from '@/constants';
import { cn } from '@/utils/cn';

/**
 * components/analysis/BestCondition.tsx
 * "분석" 화면의 추천 카드 — 통계 나열이 아니라 결론(추천)을 먼저 보여준다.
 * 별점(전체 평균 대비 구간), 안정성(같은 조합 기록들의 시간당 경험치 표준편차를 평균으로 나눈
 * 변동계수 구간), 최근 상승세(기존 computeTrend()를 이 조합의 기록만 걸러서 재사용)는 전부
 * 이미 저장된 값끼리의 단순 통계 비교일 뿐, calculations.ts의 계산식은 전혀 건드리지 않는다.
 */
export function BestCondition({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();

  const groups = groupBy(records, (r) =>
    JSON.stringify([r.huntArea, r.party.knight, r.party.elf, r.party.wizard, r.bibigi.enabled, r.bibigi.count, r.molly])
  ).filter((g) => g.count >= MIN_RECOMMEND_COUNT);

  if (!groups.length) {
    return (
      <Card className="rounded-2xl border-[#1D2530] bg-gradient-to-br from-primary/10 to-success/[0.06] py-14 text-center text-[13px] text-text-faint">
        추천을 계산하려면 동일 조건 기록이 {MIN_RECOMMEND_COUNT}회 이상 필요합니다.
      </Card>
    );
  }

  const best = sortGroups(groups, 'avg')[0];
  if (!best) return null;
  const [area, knight, elf, wizard, bibiOn, bibiCount, molly] = JSON.parse(best.key) as [string, number, number, number, boolean, number, boolean];

  const overallAvg = computeStats(records).avgPerHour;
  const diffPct = overallAvg > 0 ? ((best.avgPerHour - overallAvg) / overallAvg) * 100 : 0;
  const stars = diffPct >= 40 ? 5 : diffPct >= 25 ? 4 : diffPct >= 10 ? 3 : diffPct >= 0 ? 2 : 1;

  // 안정성: 같은 조합 기록들의 시간당 경험치 변동계수(표준편차/평균)로 구간을 나눈다.
  const mean = best.avgPerHour;
  const variance = best.list.reduce((s, r) => s + (r.expPerHour - mean) ** 2, 0) / best.list.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const stability = cv < 0.1 ? { label: '매우 안정적', tone: 'text-success' } : cv < 0.25 ? { label: '안정적', tone: 'text-primary' } : { label: '변동 있음', tone: 'text-warning' };

  // 최근 상승세: 기존 computeTrend()를 이 조합 기록만 걸러서 재사용
  const { trend } = computeTrend(best.list);
  const trendMeta = { up: { icon: TrendingUp, label: '상승세', tone: 'text-success' }, down: { icon: TrendingDown, label: '하락세', tone: 'text-danger' }, flat: { icon: Minus, label: '유지', tone: 'text-text-sub' } }[trend];

  const reason = bibiOn && molly ? '몰이+비비기 조합으로 효율 극대화' : bibiOn ? '비비기 활용으로 안정적인 파밍' : molly ? '몰이로 광역 사냥 효율 확보' : '해당 사냥터 기본 조합 중 최고 효율';

  const detail = [
    { label: '추천 파티', value: `기사${knight} 요정${elf} 법사${wizard}` },
    { label: '비비기', value: bibiOn ? `ON · ${bibiCount}명` : 'OFF' },
    { label: '몰이', value: molly ? 'ON' : 'OFF' },
  ];

  return (
    <Card className="rounded-2xl border-gold/30 bg-gradient-to-br from-gold-dim to-transparent">
      <div className="mb-2 flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={20} className={cn(i < stars ? 'fill-gold text-gold' : 'text-text-faint')} />
        ))}
        <span className="ml-2 text-[12px] font-bold uppercase tracking-wide text-gold">추천 사냥터</span>
      </div>
      <div className="mb-3 text-center text-[24px] font-bold text-white">{area}</div>
      <div className="mb-1 text-center font-display text-[56px] font-bold leading-none text-gold">{formatPercent(best.avgPerHour)}</div>
      <div className="mb-2 text-center text-[14px] font-semibold text-success">
        평균보다 {diffPct >= 0 ? '+' : ''}
        {diffPct.toFixed(0)}%
      </div>
      <div className="mb-6 text-center text-[12.5px] italic text-text-sub">"{reason}"</div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#1D2530] bg-white/[0.02] px-3.5 py-3">
          <trendMeta.icon size={16} className={trendMeta.tone} />
          <div>
            <div className="text-[10.5px] text-text-faint">최근 상승세</div>
            <div className={cn('text-[13px] font-bold', trendMeta.tone)}>{trendMeta.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-[#1D2530] bg-white/[0.02] px-3.5 py-3">
          <Shield size={16} className={stability.tone} />
          <div>
            <div className="text-[10.5px] text-text-faint">안정성</div>
            <div className={cn('text-[13px] font-bold', stability.tone)}>{stability.label}</div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-[14px]">
        {detail.map((it) => (
          <div key={it.label} className="text-center">
            <div className="mb-1 text-[11px] text-text-sub">{it.label}</div>
            <div className="font-display text-[13px] font-bold">{it.value}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-[12.5px] text-text-faint">최근 {best.count}회 기록 기준</div>
    </Card>
  );
}

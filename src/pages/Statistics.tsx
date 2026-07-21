import { BarChart3, Trophy, ListChecks, MapPin, Flame } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_STATISTICS } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { groupBy, sortGroups, computeStats } from '@/lib/analysis';
import type { ExperienceRecord } from '@/types';
import { cn } from '@/utils/cn';

/**
 * pages/Statistics.tsx ("통계")
 * 핵심 지표 5개만 카드 하나에 모아 보여주는 간결한 통계 화면 — 평균/최고 시간당 경험치,
 * 총 기록 수, 가장 효율 좋은 사냥터, 가장 많이 간 사냥터. groupBy()/computeStats()는
 * 기존 함수 그대로 재사용 — 새 계산식은 없다.
 */
export function StatisticsPage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;

  if (!records.length) {
    return (
      <div id="page-statistics">
        <PageHeader title="📈 통계" actions={<HelpButton content={HELP_STATISTICS} />} />
        <EmptyState icon={BarChart3} title="통계 데이터가 없습니다" description="경험치 기록이 쌓이면 통계가 여기 표시됩니다." />
      </div>
    );
  }

  const overall = computeStats(records);

  const byArea = sortGroups(groupBy(records, (r) => r.huntArea), 'avg');
  const bestArea = byArea[0];

  const areaCount = new Map<string, number>();
  records.forEach((r: ExperienceRecord) => areaCount.set(r.huntArea, (areaCount.get(r.huntArea) ?? 0) + 1));
  const mostVisited = Array.from(areaCount.entries()).sort((a, b) => b[1] - a[1])[0];

  return (
    <div id="page-statistics">
      <PageHeader title="📈 통계" actions={<HelpButton content={HELP_STATISTICS} />} />

      <div className="grid grid-cols-5 gap-6 max-[1280px]:grid-cols-3 max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
        <HeroStat icon={BarChart3} tone="blue" label="평균 경험치(%/h)" value={`${formatPercent(overall.avgPerHour)}/h`} />
        <HeroStat icon={Trophy} tone="gold" label="최고 경험치(%/h)" value={`${formatPercent(overall.bestPerHour)}/h`} />
        <HeroStat icon={ListChecks} tone="blue" label="총 기록수" value={`${overall.count}건`} />
        <HeroStat icon={Flame} tone="gold" label="가장 효율 좋은 사냥터" value={bestArea ? bestArea.key : '-'} />
        <HeroStat icon={MapPin} tone="blue" label="가장 많이 간 사냥터" value={mostVisited ? mostVisited[0] : '-'} />
      </div>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  gold: 'bg-gold-dim text-gold',
} as const;

function HeroStat({ icon: Icon, tone, label, value }: { icon: typeof BarChart3; tone: keyof typeof TONE_CLASS; label: string; value: string }) {
  return (
    <Card className={cn('min-w-0 p-6', tone === 'gold' && 'border-gold/25')}>
      <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] ${TONE_CLASS[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="mb-1 text-[13px] text-text-sub">{label}</div>
      <div className={cn('break-words font-display text-[24px] font-bold tracking-tight', tone === 'gold' ? 'text-gold' : 'text-white')}>{value}</div>
    </Card>
  );
}

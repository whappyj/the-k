import type { ReactNode } from 'react';
import { Sparkles, Trophy, MapPin, Star } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { todayStr } from '@/utils/date';

/**
 * components/analysis/QuickSummaryStrip.tsx
 * "기록 목록" 화면 맨 위 요약 4칸 — 오늘 최고 효율 / 이번 주 최고 효율 / 가장 많이 간 사냥터 / 최고 효율 사냥터.
 * 전부 이미 저장된 experienceRecords의 시간당 경험치(expPerHour)·사냥터를 최댓값/최빈값으로
 * 정리해 보여줄 뿐, calculations.ts의 계산식이나 데이터 필드는 전혀 건드리지 않는다.
 */
export function QuickSummaryStrip({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const today = todayStr();

  const todayRecords = records.filter((r) => r.startDate === today);
  const todayBest = todayRecords.length ? todayRecords.reduce((b, r) => (r.expPerHour > b.expPerHour ? r : b)) : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const weekRecords = records.filter((r) => r.startDate >= weekAgoStr);
  const weekBest = weekRecords.length ? weekRecords.reduce((b, r) => (r.expPerHour > b.expPerHour ? r : b)) : null;

  // 가장 많이 간 사냥터 (최빈값)
  const areaCount = new Map<string, number>();
  records.forEach((r) => areaCount.set(r.huntArea, (areaCount.get(r.huntArea) ?? 0) + 1));
  const areaEntries = Array.from(areaCount.entries());
  const mostVisitedEntry = areaEntries.length ? areaEntries.reduce((best, entry) => (entry[1] > best[1] ? entry : best)) : null;
  const mostVisited = mostVisitedEntry ? { area: mostVisitedEntry[0], count: mostVisitedEntry[1] } : null;

  // 최고 효율 사냥터 (전체 기록 중 시간당 경험치 최댓값을 낸 사냥터)
  const bestOverall = records.length ? records.reduce((b, r) => (r.expPerHour > b.expPerHour ? r : b)) : null;

  return (
    <div className="mb-6 grid grid-cols-4 gap-5 max-[1100px]:grid-cols-2">
      <SummaryCard icon={Sparkles} tone="green" label="오늘 최고 효율">
        {todayBest ? (
          <>
            <div className="font-display text-[18px] font-bold text-white">{formatPercent(todayBest.expPerHour)}/h</div>
            <div className="mt-0.5 truncate text-[11px] text-text-faint">{todayBest.huntArea}</div>
          </>
        ) : (
          <div className="text-[12px] text-text-faint">오늘 기록 없음</div>
        )}
      </SummaryCard>

      <SummaryCard icon={Trophy} tone="gold" label="이번 주 최고 효율">
        {weekBest ? (
          <>
            <div className="truncate text-[18px] font-bold text-gold">{formatPercent(weekBest.expPerHour)}/h</div>
            <div className="mt-0.5 truncate text-[11px] text-text-faint">{weekBest.huntArea}</div>
          </>
        ) : (
          <div className="text-[12px] text-text-faint">이번 주 기록 없음</div>
        )}
      </SummaryCard>

      <SummaryCard icon={MapPin} tone="blue" label="가장 많이 간 사냥터">
        {mostVisited ? (
          <>
            <div className="truncate text-[18px] font-bold text-white">{mostVisited.area}</div>
            <div className="mt-0.5 text-[11px] text-text-faint">{mostVisited.count}회 방문</div>
          </>
        ) : (
          <div className="text-[12px] text-text-faint">기록 없음</div>
        )}
      </SummaryCard>

      <SummaryCard icon={Star} tone="red" label="최고 효율 사냥터">
        {bestOverall ? (
          <>
            <div className="truncate text-[18px] font-bold text-white">{bestOverall.huntArea}</div>
            <div className="mt-0.5 text-[11px] text-text-faint">{formatPercent(bestOverall.expPerHour)}/h</div>
          </>
        ) : (
          <div className="text-[12px] text-text-faint">기록 없음</div>
        )}
      </SummaryCard>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  gold: 'bg-gold-dim text-gold',
  green: 'bg-success-dim text-success',
  red: 'bg-danger-dim text-danger',
} as const;

function SummaryCard({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: typeof Sparkles;
  tone: keyof typeof TONE_CLASS;
  label: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex h-[140px] flex-col p-5">
      <span className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={14} />
      </span>
      <div className="mb-1.5 text-[10.5px] font-semibold text-text-faint">{label}</div>
      {children}
    </Card>
  );
}

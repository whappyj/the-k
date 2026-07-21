import { Scale } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_COMPARE } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { groupBy, sortGroups } from '@/lib/analysis';
import { cn } from '@/utils/cn';

/**
 * pages/Compare.tsx
 * "비교" 화면 — 사냥터별 순위표만 보여준다. "기록 vs 기록" 비교는 경험치 기록 화면의
 * "비교" 탭(RecordVsRecord)으로 이동했다. 그룹핑(groupBy)·평균 계산(sortGroups)은 기존
 * 함수 그대로 재사용 — 새 계산식은 없다.
 */
export function ComparePage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;

  if (!records.length) {
    return (
      <div id="page-compare">
        <PageHeader title="⚖ 비교" actions={<HelpButton content={HELP_COMPARE} />} />
        <EmptyState icon={Scale} title="비교할 기록이 없습니다" description="경험치 기록이 쌓이면 사냥터별 효율을 비교할 수 있습니다." />
      </div>
    );
  }

  const groups = sortGroups(groupBy(records, (r) => r.huntArea), 'avg');
  const maxRate = groups[0]?.avgPerHour ?? 1;

  return (
    <div id="page-compare">
      <PageHeader title="⚖ 비교" actions={<HelpButton content={HELP_COMPARE} />} />

      <Card className="p-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-[#1D2530] text-left text-[12px] text-text-faint">
                <th className="px-4 py-2.5 font-semibold">순위</th>
                <th className="px-4 py-2.5 font-semibold">사냥터</th>
                <th className="px-4 py-2.5 text-right font-semibold">평균(%/h)</th>
                <th className="px-4 py-2.5">효율</th>
                <th className="px-4 py-2.5 text-right font-semibold">기록 수</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g.key} className={cn('border-b border-[#1D2530] last:border-none', i === 0 && 'bg-primary-dim/40')}>
                  <td className="px-4 py-2.5 font-display font-bold text-text-faint">{i + 1}</td>
                  <td className="min-w-0 break-words px-4 py-2.5 font-bold text-white">{g.key}</td>
                  <td className={cn('px-4 py-2.5 text-right font-display font-bold', i === 0 ? 'text-primary' : 'text-white')}>{formatPercent(g.avgPerHour)}/h</td>
                  <td className="px-4 py-2.5">
                    <div className="h-2.5 w-full min-w-[80px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.max(4, (g.avgPerHour / maxRate) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-sub">{g.count}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

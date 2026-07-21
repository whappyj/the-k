import { useState } from 'react';
import { Sword, GitCompareArrows, Scale } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_COMPARE } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { groupBy, sortGroups } from '@/lib/analysis';
import { RecordVsRecord } from '@/components/compare/RecordVsRecord';
import { cn } from '@/utils/cn';

/**
 * pages/Compare.tsx
 * "비교" 화면 — 오직 비교만 한다. 사냥터 비교(순위 표)와 기록 vs 기록 비교 두 모드만 있으며,
 * Champion/추천/목표/예상 같은 요약성 카드는 전부 제거했다. 그룹핑(groupBy)·평균 계산
 * (sortGroups)은 기존 함수 그대로 재사용 — 새 계산식은 없다.
 */
export function ComparePage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;
  const [mode, setMode] = useState<'area' | 'record'>('area');

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

      <div className="mb-6 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <ModeTab active={mode === 'area'} icon={Sword} label="사냥터 비교" desc="사냥터별 순위표로 비교" onClick={() => setMode('area')} />
        <ModeTab active={mode === 'record'} icon={GitCompareArrows} label="기록 vs 기록" desc="기록 두 개를 골라 직접 비교" onClick={() => setMode('record')} />
      </div>

      {mode === 'record' ? (
        <RecordVsRecord records={records} />
      ) : (
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
      )}
    </div>
  );
}

function ModeTab({ active, icon: Icon, label, desc, onClick }: { active: boolean; icon: typeof Sword; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3.5 rounded-2xl border p-6 text-left transition-all duration-200',
        active ? 'border-primary/50 bg-primary-dim' : 'border-[#1D2530] bg-[#0B1016] hover:bg-white/[0.045]'
      )}
    >
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', active ? 'bg-primary text-white' : 'bg-white/[0.06] text-text-sub')}>
        <Icon size={20} />
      </span>
      <div>
        <div className={cn('text-[15px] font-bold', active ? 'text-primary' : 'text-white')}>{label}</div>
        <div className="text-[12px] text-text-faint">{desc}</div>
      </div>
    </button>
  );
}

import type { GoalResult } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmptyCell } from '@/components/common/EmptyState';
import { StatItem as Item } from '@/components/common/StatItem';
import { cn } from '@/utils/cn';

const STATUS_MAP = {
  achievable: { icon: '🟢', text: '현재 속도로 달성 가능', cls: 'bg-success-dim text-success' },
  needMore: { icon: '🟠', text: '조금 더 사냥 필요', cls: 'bg-warning-dim text-warning' },
  impossible: { icon: '🔴', text: '현재 속도로는 불가능', cls: 'bg-danger-dim text-danger' },
} as const;

interface GoalCardProps {
  targetDate: string;
  onTargetDateChange: (v: string) => void;
  hasCore: boolean;
  goal: GoalResult | null;
}

export function GoalCard({ targetDate, onTargetDateChange, hasCore, goal }: GoalCardProps) {
  const { formatPercent } = useFormatters();

  return (
    <Card className="border-t-[3px] border-t-warning bg-warning/[0.04]">
      <div className="mb-[18px] max-w-[260px]">
        <Label className="mb-1.5 block">목표 날짜</Label>
        <Input type="date" value={targetDate} onChange={(e) => onTargetDateChange(e.target.value)} />
      </div>

      {!hasCore ? (
        <EmptyCell>시작/종료 정보를 먼저 입력해주세요.</EmptyCell>
      ) : !targetDate ? (
        <EmptyCell>목표 날짜를 입력하면 필요한 속도를 계산합니다.</EmptyCell>
      ) : goal?.invalid ? (
        <div className="py-8 text-center text-[13px] text-danger">목표 날짜는 종료 시각 이후여야 합니다.</div>
      ) : goal ? (
        <>
          <div className="mb-[18px] grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            <Item label="남은 일수" value={`${goal.remainDays.toFixed(1)}일`} />
            <Item label="필요 일평균 경험치" value={formatPercent(goal.requiredDayExp)} />
            <Item label="필요 시간당 경험치" value={formatPercent(goal.requiredHourExp)} />
          </div>
          <div className="mb-4">
            <CompareRow label="현재" value={formatPercent(goal.currentHourExp)} />
            <CompareRow label="필요" value={formatPercent(goal.requiredHourExp)} />
            <CompareRow label="차이" value={goal.diffPercent === Infinity ? '∞' : formatPercent(goal.diffPercent, 1)} />
          </div>
          <div className={cn('rounded-xl p-3.5 text-center text-sm font-bold', STATUS_MAP[goal.status ?? 'impossible'].cls)}>
            {STATUS_MAP[goal.status ?? 'impossible'].icon} {STATUS_MAP[goal.status ?? 'impossible'].text}
          </div>
        </>
      ) : null}
    </Card>
  );
}


function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-border/[0.08] py-2 text-[13px] text-text-sub first:border-none">
      <span>{label}</span>
      <span className="font-semibold text-text">{value}</span>
    </div>
  );
}

import type { ExperienceRecord } from '@/types';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { computeVelocityWindows, computeGoal } from '@/lib/expVelocity';
import { todayStr } from '@/utils/date';

/**
 * 목표일을 입력하면(저장됨) 최근 7일 평균 페이스를 기준으로
 * 목표까지 필요한 하루 평균과 달성 가능 여부, 부족분을 계산해 보여준다.
 */
export function ExpGoalCard({ records, currentExpPercent }: { records: ExperienceRecord[]; currentExpPercent: number }) {
  const { data } = useAppData();
  const { patchExpGoal } = useAppDataActions();
  const { formatPercent } = useFormatters();

  const sevenDay = computeVelocityWindows(records).find((w) => w.key === '7d')!;
  const goal = data.expGoal.targetDate ? computeGoal(currentExpPercent, sevenDay.perDayRate, data.expGoal.targetDate) : null;

  return (
    <Card>
      <CardTitle>🎯 목표 달성 예측</CardTitle>
      <CardDescription>목표 날짜를 입력하면 최근 7일 평균 페이스 기준으로 달성 가능 여부를 계산합니다.</CardDescription>

      <div className="mb-4 max-w-[240px]">
        <Label className="mb-1.5 block">목표일</Label>
        <Input type="date" min={todayStr()} value={data.expGoal.targetDate ?? ''} onChange={(e) => patchExpGoal({ targetDate: e.target.value || null })} />
      </div>

      {!data.expGoal.targetDate ? (
        <div className="text-[13px] text-text-faint">목표일을 입력하면 아래에 결과가 표시됩니다.</div>
      ) : !goal ? (
        <div className="text-[13px] text-danger">날짜 형식이 올바르지 않습니다.</div>
      ) : goal.daysRemaining <= 0 ? (
        <div className="text-[13px] text-text-sub">목표일이 이미 지났습니다.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <div className="rounded-2xl border border-border/[0.08] bg-white/[0.03] p-4">
            <div className="mb-2 flex justify-between text-[13px]">
              <span className="text-text-sub">현재 평균</span>
              <span className="font-display font-semibold">{formatPercent(goal.currentPerDayRate)}/일</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-sub">필요 평균</span>
              <span className="font-display font-semibold">{formatPercent(goal.requiredPerDayRate)}/일</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/[0.08] bg-white/[0.03] p-4 text-center">
            <Badge variant={goal.achievable ? 'success' : 'danger'}>{goal.achievable ? '목표 달성 가능' : '목표 달성 어려움'}</Badge>
            {goal.achievable ? (
              <div className="text-[13px] text-text-sub">현재 페이스로 목표일까지 도달 가능합니다.</div>
            ) : (
              <div className="text-[13px] text-text-sub">
                하루 <span className="font-display font-bold text-danger">{formatPercent(goal.shortfallPerDay)}</span> 더 획득해야 합니다.
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

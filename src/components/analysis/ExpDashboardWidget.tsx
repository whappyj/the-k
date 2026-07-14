import type { ExperienceRecord, ExpGoal } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeVelocityWindows, computeEta, computeGoal } from '@/lib/expVelocity';
import { todayStr } from '@/utils/date';

/**
 * 메인 화면 대시보드 위젯. 경험치 기록이 있으면 현재 레벨/경험치, 오늘 획득량,
 * 24h/7일/30일 평균, 예상 완료일, 목표 달성 가능 여부를 한 카드에 모아 보여준다.
 */
export function ExpDashboardWidget({ records, goal }: { records: ExperienceRecord[]; goal: ExpGoal }) {
  const { formatPercent } = useFormatters();

  if (!records.length) return null;

  const latest = [...records].sort(
    (a, b) => new Date(`${b.endDate}T${b.endTime}`).getTime() - new Date(`${a.endDate}T${a.endTime}`).getTime()
  )[0]!;
  const today = todayStr();
  const todayGained = records.filter((r) => r.endDate === today).reduce((s, r) => s + r.gainExp, 0);
  const windows = computeVelocityWindows(records);
  const eta = computeEta(latest.endExp, windows[0]!.perDayRate);
  const goalResult = goal.targetDate ? computeGoal(latest.endExp, windows[1]!.perDayRate, goal.targetDate) : null;

  return (
    <Card className="rounded-2xl border-[#1D2530] bg-gradient-to-br from-primary/10 to-success/[0.06]">
      <div className="mb-3 text-[15px] font-bold">📈 경험치 대시보드</div>
      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        <Item label="현재" value={`Lv${latest.endLevel} ${formatPercent(latest.endExp)}`} />
        <Item label="오늘 획득" value={`+${formatPercent(todayGained)}`} tone="text-success" />
        <Item label="최근 24시간" value={`+${formatPercent(windows[0]!.gainPercent)}`} />
        <Item label="최근 7일 평균" value={`${formatPercent(windows[1]!.perDayRate)}/일`} />
        <Item label="최근 30일 평균" value={`${formatPercent(windows[2]!.perDayRate)}/일`} />
        <Item label="예상 완료" value={eta.days !== null ? `약 ${eta.days.toFixed(1)}일` : '예측 불가'} tone="text-primary" />
        <div className="text-center">
          <div className="mb-1.5 text-xs text-text-sub">목표 달성</div>
          {goalResult ? (
            <Badge variant={goalResult.achievable ? 'success' : 'danger'}>{goalResult.achievable ? '가능' : '부족'}</Badge>
          ) : (
            <Badge variant="muted">목표 미설정</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function Item({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="text-center">
      <div className="mb-1.5 text-xs text-text-sub">{label}</div>
      <div className={`font-display text-lg font-bold ${tone ?? ''}`}>{value}</div>
    </div>
  );
}

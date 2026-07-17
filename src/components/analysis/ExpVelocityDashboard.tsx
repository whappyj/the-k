import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { computeVelocityWindows, computeEta, computeOverallAverage, computeBestWorstStats, computeTrend } from '@/lib/expVelocity';
import { cn } from '@/utils/cn';

function formatEtaDays(days: number | null): string {
  if (days === null) return '예측 불가';
  if (days <= 0) return '이미 도달';
  return `약 ${days.toFixed(2)}일`;
}

function formatEtaDate(date: Date | null): string {
  if (!date) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

/**
 * 레벨별 필요 경험치 테이블 없이, 기록에 저장된 gainExp(%) 합산만으로
 * 24시간/7일/30일 획득 속도와 100% 도달 예상 시점을 계산해 보여준다.
 */
export function ExpVelocityDashboard({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();

  if (!records.length) {
    return (
      <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016] py-14 text-center text-[13px] text-text-faint">
        경험치 기록이 쌓이면 획득 속도와 예상 완료일이 여기 표시됩니다.
      </Card>
    );
  }

  const latest = [...records].sort(
    (a, b) => new Date(`${b.endDate}T${b.endTime}`).getTime() - new Date(`${a.endDate}T${a.endTime}`).getTime()
  )[0]!;
  const windows = computeVelocityWindows(records);
  const overall = computeOverallAverage(records);
  const bestWorst = computeBestWorstStats(records);
  const { trend, recentAvg, baselineAvg } = computeTrend(records);

  const trendMeta = {
    up: { icon: TrendingUp, label: '증가 추세', color: 'text-success' },
    down: { icon: TrendingDown, label: '감소 추세', color: 'text-danger' },
    flat: { icon: Minus, label: '보합', color: 'text-text-sub' },
  }[trend];
  const TrendIcon = trendMeta.icon;

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-[#1D2530] bg-gradient-to-br from-primary/10 to-success/[0.06]">
        <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
          <div className="text-center">
            <div className="mb-1.5 text-xs text-text-sub">현재</div>
            <div className="font-display text-2xl font-bold">
              Lv{latest.endLevel} {formatPercent(latest.endExp)}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1.5 text-xs text-text-sub">최근 24시간</div>
            <div className="font-display text-2xl font-bold text-success">+{formatPercent(windows[0]!.gainPercent)}</div>
          </div>
          <div className="text-center">
            <div className="mb-1.5 text-xs text-text-sub">남은 경험치</div>
            <div className="font-display text-2xl font-bold text-warning">{formatPercent(Math.max(0, 100 - latest.endExp))}</div>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016]">
        <CardTitle className="!mb-3">기간별 획득 속도 &amp; 예상 완료</CardTitle>
        <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
          {windows.map((w) => {
            const eta = computeEta(latest.endExp, w.perDayRate);
            return (
              <div key={w.key} className={cn('rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5', !w.hasData && 'opacity-60')}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text-sub">{w.label}</span>
                  <Badge variant={w.hasData ? 'primary' : 'muted'}>{w.recordCount}건</Badge>
                </div>
                <div className="mb-2 text-[11px] text-text-faint">
                  {w.key === '24h' ? `합계 +${formatPercent(w.gainPercent)}` : `합계 +${formatPercent(w.gainPercent)} · 일평균 +${formatPercent(w.perDayRate)}`}
                </div>
                <div className="border-t border-[#1D2530] pt-2">
                  <div className="font-display text-[16px] font-bold text-primary">{formatEtaDays(eta.days)}</div>
                  <div className="mt-0.5 text-[10.5px] text-text-faint">{formatEtaDate(eta.etaDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016]">
          <CardTitle className="!mb-3">전체 평균 &amp; 최고·최저</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] text-text-sub">전체 평균 (기록 시작부터)</div>
              <div className="font-display text-lg font-bold">{formatPercent(overall.perDayRate)}/일</div>
              <div className="mt-0.5 text-[10.5px] text-text-faint">총 {formatPercent(overall.totalGain)} · {overall.spanDays.toFixed(1)}일간</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-text-sub">최고 하루 / 최저 하루</div>
              <div className="font-display text-lg font-bold text-success">{bestWorst.bestDay ? `+${formatPercent(bestWorst.bestDay.gain)}` : '-'}</div>
              <div className="mt-0.5 text-[10.5px] text-text-faint">최저 {bestWorst.worstDay ? `+${formatPercent(bestWorst.worstDay.gain)}` : '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016]">
          <CardTitle className="!mb-3">주간/월간 평균 &amp; 추세</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] text-text-sub">최고 주간 / 월간 평균</div>
              <div className="font-display text-lg font-bold text-primary">{formatPercent(bestWorst.bestWeeklyAvg)}/일</div>
              <div className="mt-0.5 text-[10.5px] text-text-faint">월간 {formatPercent(bestWorst.bestMonthlyAvg)}/일</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-text-sub">사냥 추세</div>
              <div className={cn('flex items-center gap-1.5 font-display text-lg font-bold', trendMeta.color)}>
                <TrendIcon size={16} />
                {trendMeta.label}
              </div>
              <div className="mt-0.5 text-[10.5px] text-text-faint">
                7일 {formatPercent(recentAvg)}/일 · 30일 {formatPercent(baselineAvg)}/일
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar, Clock, Target, Shield, Swords, Sunrise, Sword, TrendingUp } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_LEVELUP } from '@/lib/helpContent';
import { Card, Panel } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/common/EmptyState';
import { simulateLevelUp } from '@/lib/levelUpSimulation';
import { cn } from '@/utils/cn';

const BATTLE_OPTIONS = Array.from({ length: 49 }, (_, i) => i * 30); // 0~1440분(24시간), 30분 단위
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function formatDday(ms: number): string {
  if (ms <= 0) return '0일 0시간 0분';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}일 ${hours}시간 ${minutes}분`;
}

function formatKoreanDateTime(d: Date): { date: string; weekday: string; time: string } {
  return {
    date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
    weekday: WEEKDAY[d.getDay()] ?? '',
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
}

/**
 * pages/LevelUpSimulator.tsx ("레벨업 시뮬레이터")
 * 현재 시각부터 하루씩 실제 달력을 진행시키며 메인탐(매일 4회×30분)/정기점검(수요일
 * 05:00~10:00)/공성전(일요일 20:00~21:00)/전투·쟁(사용자가 고른 하루 고정 분)을 자동으로
 * 제외하고 남는 시간만 사냥 가능 시간으로 보아 목표 레벨까지 걸리는 정확한 날짜·시각을
 * 계산한다. 시뮬레이션 로직은 src/lib/levelUpSimulation.ts(순수 함수, calculations.ts와
 * 무관)에 있으며, 여기서는 입력값을 넘기고 결과를 표시만 한다.
 */
export function LevelUpSimulatorPage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;

  const recent = useMemo(
    () => [...records].sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())[0] ?? null,
    [records]
  );

  const [currentLevel, setCurrentLevel] = useState<number | ''>(recent?.endLevel ?? '');
  const [currentExp, setCurrentExp] = useState<number | ''>(recent?.endExp ?? '');
  const [targetLevel, setTargetLevel] = useState<number | ''>('');
  const [dailyHours, setDailyHours] = useState<number | ''>(4);
  const [battleMinutes, setBattleMinutes] = useState(0);

  const perHour = recent?.expPerHour ?? 0;

  if (!records.length) {
    return (
      <div id="page-levelup-simulator">
        <PageHeader title="📈 레벨업 시뮬레이터" actions={<HelpButton content={HELP_LEVELUP} />} />
        <EmptyState icon={TrendingUp} title="기록이 필요합니다" description="경험치 기록이 쌓이면 레벨업 시뮬레이터를 사용할 수 있습니다." />
      </div>
    );
  }

  const lvNow = currentLevel === '' ? 0 : Number(currentLevel);
  const expNow = currentExp === '' ? 0 : Number(currentExp);
  const target = targetLevel === '' ? null : Number(targetLevel);
  const remainingPercent = target !== null ? Math.max(0, (target - lvNow) * 100 - expNow) : null;
  const dailyCap = Number(dailyHours) || 0;

  const now = new Date();
  const result = target !== null && remainingPercent !== null ? simulateLevelUp(now, perHour, remainingPercent, battleMinutes, dailyCap) : null;

  // 목표 레벨에서 끊지 않고, 목표 달성 이후에도 같은 사냥 조건으로 계속 이어서
  // 다음 레벨들의 완료 예정일까지 Timeline에 표시한다("기능 복원" — 예전 동작 그대로).
  const EXTRA_LEVELS_AFTER_TARGET = 4;
  const levelSteps: { level: number; result: ReturnType<typeof simulateLevelUp> }[] = [];
  if (target !== null && target > lvNow) {
    const lastLevel = target + EXTRA_LEVELS_AFTER_TARGET;
    for (let lv = lvNow + 1; lv <= lastLevel; lv++) {
      const remainToLv = (lv - lvNow) * 100 - expNow;
      levelSteps.push({ level: lv, result: simulateLevelUp(now, perHour, remainToLv, battleMinutes, dailyCap) });
    }
  }

  const completion = result ? formatKoreanDateTime(result.completionDate) : null;
  const remainMs = result ? result.completionDate.getTime() - now.getTime() : 0;

  return (
    <div id="page-levelup-simulator">
      <PageHeader title="📈 레벨업 시뮬레이터" actions={<HelpButton content={HELP_LEVELUP} />} />

      <div className="grid grid-cols-[1.1fr_1fr] items-start gap-8 max-[1100px]:grid-cols-1">
        <div className="flex flex-col gap-6">
          <Card className="p-8">
            <div className="mb-6 text-[14px] font-bold text-text-sub">현재 상태 & 목표</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <Field label="현재 레벨">
                <Input type="number" min={1} value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
              <Field label="현재 경험치 (%)">
                <Input type="number" min={0} max={100} value={currentExp} onChange={(e) => setCurrentExp(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
            </div>
            <div className="mb-6">
              <Field label="목표 레벨">
                <Input type="number" min={1} value={targetLevel} placeholder={`${lvNow + 1}`} onChange={(e) => setTargetLevel(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
            </div>
            <div className="text-[12px] text-text-faint">
              기준 시간당 경험치: <span className="font-display font-bold text-primary">{formatPercent(perHour)}/h</span> (최근 기록 기준)
            </div>
          </Card>

          <Card className="p-8">
            <div className="mb-6 text-[14px] font-bold text-text-sub">하루 사냥 계획</div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <Field label="평균 하루 사냥시간 (h)">
                <Input type="number" min={0} step={0.5} value={dailyHours} onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
              <Field label="전투 / 쟁 시간">
                <select
                  className="h-12 w-full rounded-input border border-border/[0.08] bg-white/[0.04] px-3.5 text-[13px] text-text outline-none"
                  value={battleMinutes}
                  onChange={(e) => setBattleMinutes(Number(e.target.value))}
                >
                  {BATTLE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="text-[12px] text-text-faint">메인탐(매일 4회×30분) · 정기점검(수요일 05:00~10:00) · 공성전(일요일 20:00~21:00)은 자동으로 제외됩니다.</div>
          </Card>
        </div>

        <div className="sticky top-6 flex flex-col gap-6">
          <Card className="p-8 sm:p-9">
            <div className="mb-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-dim to-transparent p-8 text-center">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primary/80">목표 Lv{target ?? '-'}</div>
              {completion ? (
                <>
                  <div className="mb-1.5 font-display text-[16px] font-bold text-text-sub">예상 완료</div>
                  <div className="font-display text-[40px] font-bold leading-none text-primary">
                    {completion.date} <span className="text-[19px] text-primary/70">({completion.weekday}) {completion.time}</span>
                  </div>
                  <div className="mt-4 text-[14px] font-semibold text-white">남은시간 {formatDday(remainMs)}</div>
                </>
              ) : (
                <div className="font-display text-[44px] font-bold leading-none text-primary">-</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ResultStat icon={Calendar} tone="green" label="예상 완료" value={completion ? `${completion.date} ${completion.time}` : '-'} />
              <ResultStat icon={Target} tone="primary" label="남은 경험치" value={remainingPercent !== null ? formatPercent(remainingPercent) : '-'} />
              <ResultStat icon={Clock} tone="blue" label="하루 사냥시간" value={`${dailyCap.toFixed(1)}h`} />
              <ResultStat icon={Clock} tone="red" label="총 소요일" value={result ? `${result.totalDays}일` : '-'} />
              <ResultStat icon={TrendingUp} tone="primary" label="하루 획득 경험치" value={result ? formatPercent(result.effectiveDailyHoursAvg * perHour) : '-'} className="col-span-2" />
            </div>
          </Card>

          {result && (
            <Panel title="자동 차감 로그" accent="primary">
              <div className="grid grid-cols-2 gap-4">
                <DeductStat icon={Sunrise} tone="blue" label="메인탐" count={`${result.maintownCount}회`} minutes={result.maintownMinutes} />
                <DeductStat icon={Shield} tone="primary" label="정기점검" count={`${result.checkCount}회`} minutes={result.checkMinutes} />
                <DeductStat icon={Swords} tone="red" label="공성전" count={`${result.siegeCount}회`} minutes={result.siegeMinutes} />
                <DeductStat icon={Sword} tone="green" label="전투 / 쟁" count="총 시간" minutes={result.battleMinutesTotal} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#1D2530] bg-white/[0.02] px-6 py-3.5">
                <span className="text-[13px] font-semibold text-text-sub">총 차감시간</span>
                <span className="font-display text-[16px] font-bold text-primary">
                  {formatDday(60000 * (result.maintownMinutes + result.checkMinutes + result.siegeMinutes + result.battleMinutesTotal))}
                </span>
              </div>
            </Panel>
          )}

          {levelSteps.length > 0 && (
            <Panel title="다음 레벨 Timeline" accent="blue">
              <div className="flex flex-col gap-0">
                {levelSteps.map((s, i) => {
                  const t = s.result ? formatKoreanDateTime(s.result.completionDate) : null;
                  return (
                    <div key={s.level} className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dim font-display text-[11px] font-bold text-primary">Lv{s.level}</span>
                        {i < levelSteps.length - 1 && <span className="my-0.5 h-6 w-px bg-[#1D2530]" />}
                      </div>
                      <div className="flex-1 border-b border-[#1D2530] py-3.5 last:border-none">
                        {t ? (
                          <div className="text-[14px] font-semibold text-white">
                            {t.date} <span className="text-text-faint">({t.weekday})</span> {t.time}
                          </div>
                        ) : (
                          <div className="text-[14px] text-text-faint">-</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  green: 'bg-success-dim text-success',
  red: 'bg-danger-dim text-danger',
  primary: 'bg-primary-dim text-primary',
} as const;

function ResultStat({ icon: Icon, tone, label, value, className }: { icon: typeof Target; tone: keyof typeof TONE_CLASS; label: string; value: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[#1D2530] bg-white/[0.02] p-4', className)}>
      <span className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="mb-1 text-[11.5px] text-text-sub">{label}</div>
      <div className="font-display text-[15px] font-bold text-white">{value}</div>
    </div>
  );
}

function DeductStat({ icon: Icon, tone, label, count, minutes }: { icon: typeof Sunrise; tone: keyof typeof TONE_CLASS; label: string; count: string; minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return (
    <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
      <span className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="mb-1 text-[11.5px] text-text-sub">{label}</div>
      <div className="font-display text-[14px] font-bold text-white">
        {count} · {h}시간 {m}분
      </div>
    </div>
  );
}

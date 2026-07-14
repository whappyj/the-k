import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TrendingUp, Calendar, Clock, Target } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Panel } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmptyCell } from '@/components/common/EmptyState';
import type { ExperienceRecord } from '@/types';
import { cn } from '@/utils/cn';

type BaseMode = 'recent' | 'best' | 'custom';

/**
 * pages/LevelUpSimulator.tsx ("레벨업 시뮬레이터")
 * 기존 "24시간 계산기"를 대체한다. 저장된 기록에서 기준(현재 레벨/경험치/시간당 경험치)을
 * 가져와 목표 레벨까지 걸리는 일수를 계산한다. 전부 단순 비례식(시간당 경험치 × 실제 사냥시간)
 * 이며, 이미 기록에 저장된 expPerHour만 사용한다 — calculations.ts는 전혀 건드리지 않는다.
 */
export function LevelUpSimulatorPage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;

  const recent = useMemo(
    () => [...records].sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())[0] ?? null,
    [records]
  );
  const best = useMemo(() => (records.length ? records.reduce((b, r) => (r.expPerHour > b.expPerHour ? r : b), records[0]) : null), [records]);

  const [baseMode, setBaseMode] = useState<BaseMode>('recent');
  const [customId, setCustomId] = useState<string>('');
  const baseRecord: ExperienceRecord | null = baseMode === 'recent' ? recent : baseMode === 'best' ? best : records.find((r) => r.id === customId) ?? null;

  const [targetLevel, setTargetLevel] = useState<number | ''>('');
  const [targetExp, setTargetExp] = useState<number | ''>(0);
  const [dailyHours, setDailyHours] = useState<number | ''>(4);
  const [townMinutes, setTownMinutes] = useState<number | ''>(0);
  const [restHours, setRestHours] = useState<number | ''>(0);
  const [weeklyCheck, setWeeklyCheck] = useState(true);
  const [siege, setSiege] = useState(true);

  if (!records.length) {
    return (
      <div id="page-levelup-simulator">
        <PageHeader title="📈 레벨업 시뮬레이터" subtitle="저장된 기록을 기준으로 목표 레벨까지 걸리는 시간을 계산합니다." />
        <EmptyCell>경험치 기록이 쌓이면 레벨업 시뮬레이터를 사용할 수 있습니다.</EmptyCell>
      </div>
    );
  }

  const currentLevel = baseRecord?.endLevel ?? 0;
  const currentExp = baseRecord?.endExp ?? 0;
  const perHour = baseRecord?.expPerHour ?? 0;

  const weeklyExclusion = (weeklyCheck ? 5 : 0) + (siege ? 1 : 0);
  const dailyExclusionFromWeekly = weeklyExclusion / 7;
  const rawDaily = Number(dailyHours) || 0;
  const townHours = (Number(townMinutes) || 0) / 60;
  const rest = Number(restHours) || 0;
  const effectiveDailyHours = Math.max(0, rawDaily - townHours - rest - dailyExclusionFromWeekly);
  const dailyGain = effectiveDailyHours * perHour;

  const target = targetLevel === '' ? null : Number(targetLevel);
  const targetExpVal = targetExp === '' ? 0 : Number(targetExp);
  const remainingPercent = target !== null && baseRecord ? Math.max(0, (target - currentLevel) * 100 + targetExpVal - currentExp) : null;
  const daysNeeded = remainingPercent !== null && dailyGain > 0 ? remainingPercent / dailyGain : null;

  const completionDate = daysNeeded !== null ? new Date(Date.now() + daysNeeded * 86400000) : null;

  const levelSteps: { level: number; days: number }[] = [];
  if (target !== null && baseRecord && dailyGain > 0 && target > currentLevel) {
    for (let lv = currentLevel + 1; lv <= target; lv++) {
      const remainToLv = (lv - currentLevel) * 100 - currentExp;
      levelSteps.push({ level: lv, days: Math.max(0, remainToLv / dailyGain) });
    }
  }

  return (
    <div id="page-levelup-simulator">
      <PageHeader title="📈 레벨업 시뮬레이터" subtitle="저장된 기록을 기준으로 목표 레벨까지 걸리는 시간을 계산합니다." />

      <div className="grid grid-cols-[1.1fr_1fr] items-start gap-6 max-[1100px]:grid-cols-1">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="mb-4 text-[13px] font-bold text-text-sub">기준 기록 선택</div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <BaseTab active={baseMode === 'recent'} label="최근 기록" onClick={() => setBaseMode('recent')} />
              <BaseTab active={baseMode === 'best'} label="최고 기록" onClick={() => setBaseMode('best')} />
              <BaseTab active={baseMode === 'custom'} label="직접 선택" onClick={() => setBaseMode('custom')} />
            </div>
            {baseMode === 'custom' && (
              <select
                className="mb-4 h-11 w-full rounded-input border border-border/[0.08] bg-white/[0.04] px-3.5 text-[13px] text-text outline-none"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
              >
                <option value="">기록을 선택하세요</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.startDate} · {r.huntArea} · Lv{r.endLevel}
                  </option>
                ))}
              </select>
            )}
            {baseRecord ? (
              <div className="grid grid-cols-4 gap-3">
                <MiniStat label="현재 레벨" value={`Lv ${baseRecord.endLevel}`} />
                <MiniStat label="현재 경험치" value={formatPercent(baseRecord.endExp)} />
                <MiniStat label="시간당 경험치" value={`${formatPercent(baseRecord.expPerHour)}/h`} />
                <MiniStat label="사냥터" value={baseRecord.huntArea} />
              </div>
            ) : (
              <div className="py-4 text-center text-[12.5px] text-text-faint">기준으로 사용할 기록을 선택해주세요.</div>
            )}
          </Card>

          <Card>
            <div className="mb-4 text-[13px] font-bold text-text-sub">목표 설정</div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Field label="목표 레벨">
                <Input type="number" min={1} value={targetLevel} placeholder={`${currentLevel + 1}`} onChange={(e) => setTargetLevel(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
              <Field label="목표 경험치 (%)">
                <Input type="number" min={0} max={100} value={targetExp} placeholder="0" onChange={(e) => setTargetExp(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Field label="하루 사냥시간 (h)">
                <Input type="number" min={0} step={0.5} value={dailyHours} onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
              <Field label="마을 체류시간 (분)">
                <Input type="number" min={0} value={townMinutes} onChange={(e) => setTownMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
              <Field label="휴식시간 (h)">
                <Input type="number" min={0} step={0.5} value={restHours} onChange={(e) => setRestHours(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
            </div>

            <div className="mb-1.5 text-[12px] font-bold text-text-sub">자동 옵션</div>
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-text">☑ 주간 정기점검</div>
                  <div className="text-[11px] text-text-faint">주당 5시간 제외</div>
                </div>
                <Switch checked={weeklyCheck} onCheckedChange={setWeeklyCheck} aria-label="주간 정기점검" />
              </div>
              <div className="flex items-center justify-between border-t border-[#1D2530] pt-2.5">
                <div>
                  <div className="text-[13px] font-semibold text-text">☑ 공성시간</div>
                  <div className="text-[11px] text-text-faint">주당 1시간 제외</div>
                </div>
                <Switch checked={siege} onCheckedChange={setSiege} aria-label="공성시간" />
              </div>
            </div>
          </Card>
        </div>

        <div className="sticky top-6 flex flex-col gap-5">
          <Card className="p-7 sm:p-8">
            <div className="mb-5 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold-dim to-transparent p-7 text-center">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gold/80">목표까지</div>
              <div className="font-display text-[54px] font-bold leading-none text-gold sm:text-[60px]">
                {daysNeeded !== null ? Math.ceil(daysNeeded) : '-'}
                <span className="text-[24px] text-gold/70">일</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultStat icon={Calendar} tone="green" label="예상 완료일" value={completionDate ? completionDate.toLocaleDateString('ko-KR') : '-'} />
              <ResultStat icon={Clock} tone="blue" label="하루 필요 사냥시간" value={`${rawDaily.toFixed(1)}h`} />
              <ResultStat icon={TrendingUp} tone="green" label="하루 획득 경험치" value={dailyGain > 0 ? formatPercent(dailyGain) : '-'} />
              <ResultStat icon={Target} tone="gold" label="남은 경험치" value={remainingPercent !== null ? formatPercent(remainingPercent) : '-'} />
              <ResultStat icon={Clock} tone="red" label="실제 사냥시간" value={`${effectiveDailyHours.toFixed(1)}h/일`} />
              <ResultStat icon={Clock} tone="blue" label="정기점검 차감" value={`${weeklyCheck ? (5 / 7).toFixed(2) : '0.00'}h/일`} />
              <ResultStat icon={Clock} tone="red" label="공성 차감" value={`${siege ? (1 / 7).toFixed(2) : '0.00'}h/일`} />
            </div>
          </Card>

          {levelSteps.length > 0 && (
            <Panel title="다음 레벨 예상" accent="gold">
              <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-2">
                {levelSteps.map((s) => (
                  <div key={s.level} className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-4 text-center">
                    <div className="mb-1.5 font-display text-[15px] font-bold text-white">Lv{s.level}</div>
                    <div className="font-display text-[20px] font-bold text-gold">{Math.ceil(s.days)}일</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function BaseTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-11 rounded-xl border text-[13px] font-bold transition-all duration-200',
        active ? 'border-gold/50 bg-gold-dim text-gold' : 'border-[#1D2530] bg-white/[0.02] text-text-sub hover:bg-white/[0.04]'
      )}
    >
      {label}
    </button>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-3 text-center">
      <div className="mb-1 text-[10px] text-text-faint">{label}</div>
      <div className="truncate font-display text-[13px] font-bold text-white">{value}</div>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  green: 'bg-success-dim text-success',
  red: 'bg-danger-dim text-danger',
  gold: 'bg-gold-dim text-gold',
} as const;

function ResultStat({ icon: Icon, tone, label, value }: { icon: typeof Target; tone: keyof typeof TONE_CLASS; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5">
      <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={13} />
      </span>
      <div className="mb-1 text-[10.5px] text-text-sub">{label}</div>
      <div className="font-display text-[14px] font-bold text-white">{value}</div>
    </div>
  );
}

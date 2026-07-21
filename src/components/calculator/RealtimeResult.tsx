import type { Calculator24Core, LevelUpPrediction } from '@/lib/calculations';
import type { CalculatorFormValues } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { StatItem as Item } from '@/components/common/StatItem';

export function RealtimeResult({ core }: { core: Calculator24Core | null }) {
  const { formatPercent, formatDuration } = useFormatters();
  const items = [
    { label: '총 경과시간', value: core ? formatDuration(core.totalHours * 3600) : '-' },
    { label: '실제 사냥시간', value: core ? formatDuration(core.playHours * 3600) : '-' },
    { label: '획득 경험치', value: core ? formatPercent(core.gainExp) : '-' },
    { label: '시간당 경험치', value: core ? formatPercent(core.hourExp) : '-' },
    { label: '분당 경험치', value: core ? formatPercent(core.minuteExp) : '-' },
    { label: '일평균 경험치', value: core ? formatPercent(core.dayExp) : '-' },
  ];

  return (
    <Card className="border-t-[3px] border-t-primary">
      <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {items.map((it) => (
          <div key={it.label} className="rounded-2xl border border-border/[0.08] bg-primary/[0.06] p-[18px]">
            <div className="mb-2 text-xs text-text-sub">{it.label}</div>
            <div className="font-display text-[19px] font-bold">{it.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LevelUpCard({ form, core, levelUp }: { form: CalculatorFormValues; core: Calculator24Core | null; levelUp: LevelUpPrediction | null }) {
  const { formatPercent } = useFormatters();

  return (
    <Card className="border-t-[3px] border-t-success bg-success/[0.04]">
      <div className="grid grid-cols-3 gap-[18px]">
        <Item label="현재 레벨" value={form.currentLevel ? `Lv. ${form.currentLevel}` : '-'} />
        <Item label="현재 경험치" value={formatPercent(Number(form.endExp) || 0)} />
        <Item label="남은 경험치" value={levelUp ? formatPercent(levelUp.remainExp) : '-'} />
        <Item label="시간당 경험치" value={core ? formatPercent(core.hourExp) : '-'} />
        <Item label="일평균 경험치" value={core ? formatPercent(core.dayExp) : '-'} />
        <Item label="남은 시간" value={levelUp?.remainHours != null ? `${levelUp.remainHours.toFixed(1)}시간` : '-'} />
      </div>

      <div className="my-[18px] border-y border-border/[0.08] py-6 text-center">
        <div className="mb-2 text-xs text-text-sub">예상 레벨업 날짜</div>
        <div className="font-display text-[28px] font-bold text-success">
          {!levelUp || levelUp.remainExp === 0
            ? levelUp?.remainExp === 0
              ? '이미 도달'
              : '-'
            : levelUp.expectedDate
              ? levelUp.expectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
              : '계산 불가'}
        </div>
        <div className="mt-1 text-sm text-text-sub">
          {levelUp?.expectedDate ? levelUp.expectedDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
      <div className="text-center text-[13px] text-text-sub">
        남은 일수 <span className="font-bold text-text">{levelUp?.remainDays != null ? `${levelUp.remainDays.toFixed(1)}일` : '-'}</span>
      </div>
    </Card>
  );
}

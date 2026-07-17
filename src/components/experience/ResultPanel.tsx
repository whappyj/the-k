import { Clock, Zap, TrendingUp, Award, Hourglass } from 'lucide-react';
import type { ExperienceStats } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';

interface ResultPanelProps {
  stats: ExperienceStats | null;
  endExp: number | '';
}

const PROJECTION_MINUTES = [30, 60, 120, 240, 480, 720, 1440] as const;
const PROJECTION_LABEL: Record<number, string> = { 30: '30분', 60: '1시간', 120: '2시간', 240: '4시간', 480: '8시간', 720: '12시간', 1440: '24시간' };

/**
 * components/experience/ResultPanel.tsx
 * "기록하기" 화면의 결과 영역 — 저장 전 확인용 단일 카드.
 * 시간당 경험치를 화면에서 가장 큰 숫자(60px)로 강조하고, 사냥시간/획득경험치/분당경험치는
 * 보조 지표로 그 아래 배치한다. BEST/GOOD/NORMAL 배지, Champion, 추천 등은 비교 화면으로
 * 옮기고 이 화면에서는 제거했다. 계산값은 전부 기존 computeExperienceStats() 그대로이며,
 * "시간별 환산"·"다음 레벨 예상시간"은 이미 계산된 expPerHour에 비례식만 적용한 표시값이다.
 */
export function ResultPanel({ stats, endExp }: ResultPanelProps) {
  const { formatPercent, formatDuration } = useFormatters();
  const perHour = stats?.expPerHour ?? 0;

  const remainToNextLevel = endExp === '' ? null : Math.max(0, 100 - Number(endExp));
  const remainHours = remainToNextLevel !== null && perHour > 0 ? remainToNextLevel / perHour : null;

  return (
    <div className="sticky top-6">
      <Card>
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-dim text-gold">
            <Award size={15} />
          </span>
          <span className="text-[15px] font-bold text-white">결과</span>
        </div>

        <div className="mb-5 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold-dim to-transparent p-7 text-center">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gold/80">시간당 경험치</div>
          <div className="font-display text-[64px] font-bold leading-none text-gold">
            {stats ? formatPercent(stats.expPerHour) : '-'}
            <span className="text-[24px] text-gold/70">/h</span>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat icon={Clock} tone="blue" label="사냥 시간" value={stats ? formatDuration(stats.playTime) : '-'} />
          <Stat icon={Zap} tone="green" label="획득 경험치" value={stats ? formatPercent(stats.gainExp) : '-'} />
          <Stat icon={TrendingUp} tone="red" label="분당 경험치" value={stats ? formatPercent(stats.expPerMinute) : '-'} />
        </div>

        <div className="mb-1.5 text-[12px] font-bold text-text-sub">시간별 환산</div>
        <div className="mb-5 grid grid-cols-4 gap-2 max-[480px]:grid-cols-3">
          {PROJECTION_MINUTES.map((m) => (
            <div key={m} className={`rounded-xl border p-2.5 text-center ${m === 1440 ? 'border-gold/40 bg-gold-dim' : 'border-[#1D2530] bg-white/[0.02]'}`}>
              <div className="mb-1 text-[10px] text-text-faint">{PROJECTION_LABEL[m]}</div>
              <div className={`font-display text-[11.5px] font-bold ${m === 1440 ? 'text-gold' : 'text-white'}`}>{formatPercent((perHour * m) / 60)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-dim text-primary">
            <Hourglass size={17} />
          </span>
          <div>
            <div className="mb-1 text-[11px] text-text-sub">다음 레벨까지 예상 시간</div>
            <div className="font-display text-[19px] font-bold text-white">{remainHours !== null ? formatDuration(remainHours * 3600) : '-'}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  green: 'bg-success-dim text-success',
  red: 'bg-danger-dim text-danger',
} as const;

function Stat({ icon: Icon, tone, label, value }: { icon: typeof Award; tone: keyof typeof TONE_CLASS; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5 text-center">
      <span className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={13} />
      </span>
      <div className="mb-1 text-[10.5px] text-text-sub">{label}</div>
      <div className="font-display text-[14px] font-bold text-white">{value}</div>
    </div>
  );
}

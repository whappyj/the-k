import { useState } from 'react';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const MULTIPLIERS: { hours: number; label: string }[] = [
  { hours: 0.5, label: '30분' },
  { hours: 1, label: '1시간' },
  { hours: 2, label: '2시간' },
  { hours: 4, label: '4시간' },
  { hours: 8, label: '8시간' },
  { hours: 12, label: '12시간' },
  { hours: 24, label: '24시간' },
];

/**
 * components/analysis/ExpMultiplierSimulator.tsx
 * "30분에 몇 % 벌었다"만 입력하면 30분/1/2/4/8/12/24시간 기준으로 자동 환산해 보여준다.
 * 리니지 클래식은 EXP가 아니라 %(퍼센트) 기준이므로 단순 배수 계산만 하면 된다.
 * 그래프 없이 카드로만 표시한다.
 */
export function ExpMultiplierSimulator() {
  const { formatPercent } = useFormatters();
  const [per30min, setPer30min] = useState<number | ''>('');

  const base = Number(per30min) || 0;

  return (
    <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016]">
      <Label className="mb-1.5 block">30분당 획득 경험치 (%)</Label>
      <Input
        type="number"
        step={0.01}
        placeholder="예: 1.35"
        value={per30min}
        onChange={(e) => setPer30min(e.target.value === '' ? '' : Number(e.target.value))}
        className="max-w-[200px]"
      />

      {base > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4 max-[720px]:grid-cols-3 max-[480px]:grid-cols-2">
          {MULTIPLIERS.map((m) => (
            <div key={m.hours} className="rounded-xl border border-[#1D2530] bg-white/[0.03] px-3 py-3 text-center">
              <div className="mb-1 text-xs text-text-sub">{m.label}</div>
              <div className="font-display text-lg font-bold text-primary">{formatPercent(base * m.hours * 2)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

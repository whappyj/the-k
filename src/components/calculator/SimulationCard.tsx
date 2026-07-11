import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Calculator24Core, LevelUpPrediction } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatItem as Item } from '@/components/common/StatItem';
import { EmptyCell } from '@/components/common/EmptyState';

export function SimulationCard({ core, levelUp }: { core: Calculator24Core | null; levelUp: LevelUpPrediction | null }) {
  const { formatPercent } = useFormatters();
  const [simRate, setSimRate] = useState<number | null>(null);

  useEffect(() => {
    if (core && simRate === null) setSimRate(core.hourExp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core?.hourExp]);

  return (
    <Card className="border-t-[3px] border-t-purple bg-purple/[0.04]">
      <div className="mb-4 text-[13px] text-text-sub">시간당 경험치를 직접 바꿔보면서 예상 레벨업 날짜를 미리 확인해보세요.</div>
      <div className="mb-[18px] flex items-center gap-3">
        <Label className="whitespace-nowrap">시간당 경험치 (%)</Label>
        <Input type="number" step={0.0001} className="max-w-[200px]" value={simRate ?? ''} onChange={(e) => setSimRate(e.target.value === '' ? null : Number(e.target.value))} />
        <Button variant="secondary" size="sm" onClick={() => setSimRate(core?.hourExp ?? null)}>
          <RotateCcw size={16} />
          실제값으로
        </Button>
      </div>

      {!core ? (
        <EmptyCell>시작/종료 정보를 먼저 입력해주세요.</EmptyCell>
      ) : !levelUp || levelUp.remainExp === 0 ? (
        <EmptyCell>이미 목표 경험치에 도달했습니다.</EmptyCell>
      ) : !simRate || simRate <= 0 ? (
        <EmptyCell>시간당 경험치는 0보다 커야 합니다.</EmptyCell>
      ) : (
        <SimResult core={core} remainExp={levelUp.remainExp} rate={simRate} formatPercent={formatPercent} />
      )}
    </Card>
  );
}

function SimResult({
  core,
  remainExp,
  rate,
  formatPercent,
}: {
  core: Calculator24Core;
  remainExp: number;
  rate: number;
  formatPercent: (v: number) => string;
}) {
  const remainHours = remainExp / rate;
  const remainDays = remainHours / 24;
  const expectedDate = new Date(core.end.getTime() + remainHours * 3600000);

  return (
    <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
      <Item label="시뮬레이션 시간당 경험치" value={formatPercent(rate)} />
      <Item label="예상 레벨업 날짜" value={expectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} />
      <Item label="남은 일수" value={`${remainDays.toFixed(1)}일`} />
    </div>
  );
}

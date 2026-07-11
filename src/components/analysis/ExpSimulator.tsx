import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatItem as Item } from '@/components/common/StatItem';
import { computeStats } from '@/lib/analysis';

export function ExpSimulator({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const { avgPerHour } = computeStats(records);
  const latest = [...records].sort(
    (a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime()
  )[0];

  const [current, setCurrent] = useState<number | ''>(latest?.endExp ?? 0);
  const [target, setTarget] = useState<number | ''>(100);
  const [rate, setRate] = useState<number | ''>(Number(avgPerHour.toFixed(4)));

  // 기록이 나중에 로드/갱신되는 경우를 대비해 최초 1회만 기본값을 채운다.
  useEffect(() => {
    if (latest && current === 0) setCurrent(latest.endExp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  const resetRate = () => setRate(Number(avgPerHour.toFixed(4)));

  const c = Number(current) || 0;
  const t = Number(target) || 0;
  const r = Number(rate) || 0;
  const remain = Math.max(0, t - c);
  const remainHours = r > 0 ? remain / r : null;
  const expectedDate = remainHours !== null ? new Date(Date.now() + remainHours * 3600000) : null;

  return (
    <Card className="border-t-[3px] border-t-purple bg-purple/[0.04]">
      <div className="mb-4 grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
        <div>
          <Label className="mb-1.5 block">현재 경험치 (%)</Label>
          <Input type="number" step={0.0001} value={current} onChange={(e) => setCurrent(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div>
          <Label className="mb-1.5 block">목표 경험치 (%)</Label>
          <Input type="number" step={0.0001} value={target} onChange={(e) => setTarget(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div>
          <Label className="mb-1.5 block">시간당 경험치 (%)</Label>
          <div className="flex items-center gap-1.5">
            <Input type="number" step={0.0001} value={rate} onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))} />
            <Button variant="secondary" size="icon" aria-label="평균값으로 재설정" onClick={resetRate}>
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {remain === 0 ? (
        <div className="py-2 text-center text-[13px] text-text-sub">이미 목표 경험치에 도달했습니다.</div>
      ) : remainHours === null ? (
        <div className="py-2 text-center text-[13px] text-text-sub">시간당 경험치는 0보다 커야 계산할 수 있습니다.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
          <Item label="남은 경험치" value={formatPercent(remain)} />
          <Item label="완료 예상 시간" value={`${remainHours.toFixed(1)}시간`} />
          <Item
            label="완료 예상 시각"
            value={`${expectedDate!.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ${expectedDate!.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
          />
        </div>
      )}
    </Card>
  );
}

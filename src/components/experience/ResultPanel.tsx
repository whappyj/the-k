import type { ExperienceStats } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { MAX_PARTY } from '@/constants';

interface ResultPanelProps {
  stats: ExperienceStats | null;
  bibigiEnabled: boolean;
  bibigiCount: number;
  molly: boolean;
}

export function ResultPanel({ stats, bibigiEnabled, bibigiCount, molly }: ResultPanelProps) {
  const { formatPercent, formatDuration } = useFormatters();

  return (
    <div className="sticky top-6 flex flex-col gap-3.5">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="총 경과시간" value={stats ? formatDuration(stats.totalSeconds) : '-'} />
          <MiniStat label="실제 사냥시간" value={stats ? formatDuration(stats.playTime) : '-'} />
        </div>
      </Card>
      <ResultCard label="획득 경험치" value={stats ? formatPercent(stats.gainExp) : '-'} />
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="시간당 경험치" value={stats ? formatPercent(stats.expPerHour) : '-'} />
          <MiniStat label="분당 경험치" value={stats ? formatPercent(stats.expPerMinute) : '-'} />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="파티 인원" value={`${stats?.partyCount ?? 0}명 / ${MAX_PARTY}명`} />
          <MiniStat label="비비기" value={bibigiEnabled ? 'ON' : 'OFF'} />
          <MiniStat label="비비기 인원" value={bibigiEnabled ? `${bibigiCount}명` : '-'} />
          <MiniStat label="몰이" value={molly ? 'ON' : 'OFF'} />
        </div>
      </Card>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <div className="mb-2 text-xs text-text-sub">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mb-2 text-xs text-text-sub">{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}

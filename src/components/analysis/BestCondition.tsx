import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { groupBy, sortGroups } from '@/lib/analysis';
import { MIN_RECOMMEND_COUNT } from '@/constants';

export function BestCondition({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();

  const groups = groupBy(records, (r) =>
    JSON.stringify([r.huntArea, r.party.knight, r.party.elf, r.party.wizard, r.bibigi.enabled, r.bibigi.count, r.molly])
  ).filter((g) => g.count >= MIN_RECOMMEND_COUNT);

  if (!groups.length) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-success/[0.06] py-14 text-center text-[13px] text-text-faint">
        추천을 계산하려면 동일 조건 기록이 {MIN_RECOMMEND_COUNT}회 이상 필요합니다.
      </Card>
    );
  }

  const best = sortGroups(groups, 'avg')[0];
  if (!best) return null;
  const [area, knight, elf, wizard, bibiOn, bibiCount, molly] = JSON.parse(best.key) as [string, number, number, number, boolean, number, boolean];

  const items = [
    { label: '추천 사냥터', value: area },
    { label: '추천 파티', value: `기사${knight} 요정${elf} 법사${wizard}` },
    { label: '비비기', value: bibiOn ? `ON · ${bibiCount}명` : 'OFF' },
    { label: '몰이', value: molly ? 'ON' : 'OFF' },
    { label: '평균 시간당 경험치', value: formatPercent(best.avgPerHour), strong: true },
    { label: '총 기록', value: `${best.count}회` },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-success/[0.06]">
      <div className="mb-[18px] grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="mb-1.5 text-xs text-text-sub">{it.label}</div>
            <div className={`font-display text-lg font-bold ${it.strong ? 'text-primary' : ''}`}>{it.value}</div>
          </div>
        ))}
      </div>
      <div className="text-[13px] italic text-text-sub">"현재 기록 기준 가장 높은 평균 경험치를 기록한 조건입니다."</div>
    </Card>
  );
}

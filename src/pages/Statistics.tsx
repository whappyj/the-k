import { BarChart3, Trophy, ListChecks } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_STATISTICS } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';
import { groupBy, sortGroups, computeStats } from '@/lib/analysis';
import { ExpVelocityDashboard } from '@/components/analysis/ExpVelocityDashboard';
import type { ExperienceRecord } from '@/types';

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const HOUR_BUCKETS = [
  { label: '새벽 00~06', from: 0, to: 6 },
  { label: '오전 06~12', from: 6, to: 12 },
  { label: '오후 12~18', from: 12, to: 18 },
  { label: '저녁 18~24', from: 18, to: 24 },
];

/**
 * pages/Statistics.tsx ("통계")
 * 순수 통계 화면 — Hero(평균/최고/총기록) → 효율추이 → 사냥터TOP10 → 직업/파티 → 요일평균
 * → 시간대평균 → 최근기록 순서로 배치했다. 카드를 최대한 통합해 개수를 줄였다
 * (예: 시간대별 4개 카드 → 1개 카드 안 4칸, 직업비율+몰이비비기 2개 카드 → 1개 카드).
 * groupBy()/computeStats()는 기존 함수 그대로 재사용 — 새 계산식은 없다.
 */
export function StatisticsPage() {
  const { data } = useAppData();
  const { formatPercent, formatDuration } = useFormatters();
  const records = data.experienceRecords;

  if (!records.length) {
    return (
      <div id="page-statistics">
        <PageHeader title="📈 통계" subtitle="기록 전체의 평균, 최고 기록, 시간대·요일별 경향을 보여줍니다." actions={<HelpButton content={HELP_STATISTICS} />} />
        <EmptyCell>경험치 기록이 쌓이면 통계가 여기 표시됩니다.</EmptyCell>
      </div>
    );
  }

  const overall = computeStats(records);

  const weekdayGroups = sortGroups(
    groupBy(records, (r) => WEEKDAY_LABEL[new Date(`${r.startDate}T00:00:00`).getDay()] ?? ''),
    'avg'
  );

  const hourGroups = HOUR_BUCKETS.map((b) => {
    const list = records.filter((r) => {
      const h = Number(r.startTime.split(':')[0]);
      return h >= b.from && h < b.to;
    });
    return { label: b.label, ...computeStats(list) };
  });

  const areaCount = new Map<string, number>();
  records.forEach((r: ExperienceRecord) => areaCount.set(r.huntArea, (areaCount.get(r.huntArea) ?? 0) + 1));
  const topAreas = Array.from(areaCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalKnight = records.reduce((s, r) => s + r.party.knight, 0);
  const totalElf = records.reduce((s, r) => s + r.party.elf, 0);
  const totalWizard = records.reduce((s, r) => s + r.party.wizard, 0);
  const totalJobs = totalKnight + totalElf + totalWizard || 1;
  const jobs = [
    { label: '기사', value: totalKnight, color: '#4F8CFF' },
    { label: '요정', value: totalElf, color: '#2ECC71' },
    { label: '법사', value: totalWizard, color: '#A855F7' },
  ];
  const mollyPct = Math.round((records.filter((r) => r.molly).length / records.length) * 100);
  const bibigiPct = Math.round((records.filter((r) => r.bibigi.enabled).length / records.length) * 100);

  const recentRecords = [...records]
    .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())
    .slice(0, 8);

  return (
    <div id="page-statistics">
      <PageHeader title="📈 통계" subtitle="기록 전체의 평균, 최고 기록, 시간대·요일별 경향을 보여줍니다." actions={<HelpButton content={HELP_STATISTICS} />} />

      {/* Hero: 평균효율/최고효율/총기록 하나의 카드 */}
      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
          <HeroStat icon={BarChart3} tone="blue" label="평균 시간당 경험치" value={`${formatPercent(overall.avgPerHour)}/h`} />
          <HeroStat icon={Trophy} tone="gold" label="최고 시간당 경험치" value={`${formatPercent(overall.bestPerHour)}/h`} />
          <HeroStat icon={ListChecks} tone="red" label="총 기록 수" value={`${overall.count}건`} />
        </div>
      </Card>

      <Section title="📉 효율 추이">
        <ExpVelocityDashboard records={records} />
      </Section>

      <Section title="🗺 사냥터 TOP10">
        <Card>
          <div className="flex flex-col gap-2.5">
            {topAreas.map(([area, count], i) => (
              <div key={area} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center font-display text-[12px] font-bold text-text-faint">{i + 1}</span>
                <span className="flex-1 truncate text-[13px] font-semibold">{area}</span>
                <span className="text-[12px] text-text-faint">{count}회</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="⚔ 직업 / 파티">
        <Card>
          <div className="grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">
            <div>
              <div className="mb-3 text-[12px] font-bold text-text-sub">평균 파티 구성 비율</div>
              <div className="flex flex-col gap-2.5">
                {jobs.map((j) => (
                  <div key={j.label} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-[12.5px] text-text-sub">{j.label}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.round((j.value / totalJobs) * 100)}%`, background: j.color }} />
                    </div>
                    <span className="w-12 shrink-0 text-right font-display text-[12.5px] font-bold">{Math.round((j.value / totalJobs) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 text-[12px] font-bold text-text-sub">몰이 / 비비기 사용률</div>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="text-text-sub">몰이 사용</span>
                    <span className="font-display font-bold">{mollyPct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${mollyPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="text-text-sub">비비기 사용</span>
                    <span className="font-display font-bold">{bibigiPct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-success" style={{ width: `${bibigiPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="📅 요일 평균">
        <Card>
          <div className="flex flex-col gap-2.5">
            {weekdayGroups.map((g) => (
              <div key={g.key} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-center text-[13px] font-bold text-text-sub">{g.key}요일</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.max(4, (g.avgPerHour / (weekdayGroups[0]?.avgPerHour || 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-display text-[13px] font-bold">{formatPercent(g.avgPerHour)}/h</span>
                <span className="w-14 shrink-0 text-right text-[11px] text-text-faint">{g.count}건</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="🕐 시간대 평균">
        <Card>
          <div className="grid grid-cols-4 gap-3 max-[640px]:grid-cols-2">
            {hourGroups.map((g) => (
              <div key={g.label} className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5 text-center">
                <div className="mb-1.5 text-[11px] text-text-sub">{g.label}</div>
                <div className="font-display text-[16px] font-bold text-white">{g.count > 0 ? `${formatPercent(g.avgPerHour)}/h` : '-'}</div>
                <div className="mt-1 text-[10px] text-text-faint">{g.count}건</div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="📜 최근 기록">
        <Card>
          <div className="flex flex-col gap-2">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b border-[#1D2530] py-2 last:border-none">
                <span className="w-24 shrink-0 text-[11px] text-text-faint">{r.startDate}</span>
                <span className="flex-1 truncate text-[13px] font-semibold">{r.huntArea}</span>
                <span className="shrink-0 text-[11px] text-text-faint">{formatDuration(r.playTime)}</span>
                <span className="w-24 shrink-0 text-right font-display text-[13px] font-bold text-gold">{formatPercent(r.expPerHour)}/h</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  gold: 'bg-gold-dim text-gold',
  red: 'bg-danger-dim text-danger',
} as const;

function HeroStat({ icon: Icon, tone, label, value }: { icon: typeof BarChart3; tone: keyof typeof TONE_CLASS; label: string; value: string }) {
  return (
    <div className="text-center">
      <span className={`mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
        <Icon size={17} />
      </span>
      <div className="mb-1 text-[11.5px] text-text-sub">{label}</div>
      <div className="font-display text-[26px] font-bold text-white">{value}</div>
    </div>
  );
}

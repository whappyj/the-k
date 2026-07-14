import { BarChart3, Trophy, Clock, ListChecks } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';
import { groupBy, sortGroups, computeStats } from '@/lib/analysis';
import { ExpVelocityDashboard } from '@/components/analysis/ExpVelocityDashboard';
import type { ExperienceRecord } from '@/types';

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const HOUR_BUCKETS = [
  { label: '새벽 (00~06)', from: 0, to: 6 },
  { label: '오전 (06~12)', from: 6, to: 12 },
  { label: '오후 (12~18)', from: 12, to: 18 },
  { label: '저녁 (18~24)', from: 18, to: 24 },
];

/**
 * pages/Statistics.tsx ("통계")
 * 순수 통계 화면 — 평균/최고기록/시간대별/요일별/많이 간 사냥터/효율 변화(추세)만 표시한다.
 * 추천 관련 판단(어디가 좋은지)은 "비교" 화면의 역할이라 여기서는 다루지 않는다.
 * 시간대·요일 그룹핑은 이미 저장된 startDate/startTime을 Date로 파싱해 나눈 것뿐이며,
 * groupBy()/computeStats()도 기존 함수 그대로 재사용한다 — 새 계산식은 없다.
 */
export function StatisticsPage() {
  const { data } = useAppData();
  const { formatPercent, formatDuration } = useFormatters();
  const records = data.experienceRecords;

  if (!records.length) {
    return (
      <div id="page-statistics">
        <PageHeader title="📈 통계" subtitle="기록 전체의 평균, 최고 기록, 시간대·요일별 경향을 보여줍니다." />
        <EmptyCell>경험치 기록이 쌓이면 통계가 여기 표시됩니다.</EmptyCell>
      </div>
    );
  }

  const overall = computeStats(records);

  const weekdayGroups = sortGroups(
    groupBy(records, (r) => WEEKDAY_LABEL[new Date(`${r.startDate}T00:00:00`).getDay()]),
    'avg'
  );

  const hourGroups = HOUR_BUCKETS.map((b) => {
    const list = records.filter((r) => {
      const h = Number(r.startTime.split(':')[0]);
      return h >= b.from && h < b.to;
    });
    return { label: b.label, ...computeStats(list) };
  }).filter((g) => g.count > 0);

  const areaCount = new Map<string, number>();
  records.forEach((r: ExperienceRecord) => areaCount.set(r.huntArea, (areaCount.get(r.huntArea) ?? 0) + 1));
  const topAreas = Array.from(areaCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div id="page-statistics">
      <PageHeader title="📈 통계" subtitle="기록 전체의 평균, 최고 기록, 시간대·요일별 경향을 보여줍니다." />

      <div className="mb-6 grid grid-cols-4 gap-5 max-[1100px]:grid-cols-2">
        <StatCard icon={BarChart3} tone="blue" label="평균 시간당 경험치" value={`${formatPercent(overall.avgPerHour)}/h`} />
        <StatCard icon={Trophy} tone="gold" label="최고 기록" value={`${formatPercent(overall.bestPerHour)}/h`} />
        <StatCard icon={Clock} tone="green" label="평균 사냥 시간" value={formatDuration(overall.avgPlayTime)} />
        <StatCard icon={ListChecks} tone="red" label="총 기록 수" value={`${overall.count}건`} />
      </div>

      <Section title="🕐 시간대별 평균 효율">
        <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2">
          {hourGroups.map((g) => (
            <Card key={g.label} className="p-5 text-center">
              <div className="mb-2 text-[11.5px] text-text-sub">{g.label}</div>
              <div className="font-display text-[20px] font-bold text-white">{formatPercent(g.avgPerHour)}/h</div>
              <div className="mt-1 text-[10.5px] text-text-faint">{g.count}건</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="📅 요일별 평균 효율">
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

      <Section title="⚔ 직업 비율 / 몰이·비비기 사용률">
        <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
          <Card>
            <div className="mb-3 text-[12px] font-bold text-text-sub">평균 파티 구성 비율</div>
            {(() => {
              const totalKnight = records.reduce((s, r) => s + r.party.knight, 0);
              const totalElf = records.reduce((s, r) => s + r.party.elf, 0);
              const totalWizard = records.reduce((s, r) => s + r.party.wizard, 0);
              const total = totalKnight + totalElf + totalWizard || 1;
              const jobs = [
                { label: '기사', value: totalKnight, color: '#4F8CFF' },
                { label: '요정', value: totalElf, color: '#2ECC71' },
                { label: '법사', value: totalWizard, color: '#A855F7' },
              ];
              return (
                <div className="flex flex-col gap-2.5">
                  {jobs.map((j) => (
                    <div key={j.label} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-[12.5px] text-text-sub">{j.label}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.round((j.value / total) * 100)}%`, background: j.color }} />
                      </div>
                      <span className="w-12 shrink-0 text-right font-display text-[12.5px] font-bold">{Math.round((j.value / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
          <Card>
            <div className="mb-3 text-[12px] font-bold text-text-sub">몰이 / 비비기 사용률</div>
            {(() => {
              const mollyPct = Math.round((records.filter((r) => r.molly).length / records.length) * 100);
              const bibigiPct = Math.round((records.filter((r) => r.bibigi.enabled).length / records.length) * 100);
              return (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-[12.5px]"><span className="text-text-sub">몰이 사용</span><span className="font-display font-bold">{mollyPct}%</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary" style={{ width: `${mollyPct}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[12.5px]"><span className="text-text-sub">비비기 사용</span><span className="font-display font-bold">{bibigiPct}%</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-success" style={{ width: `${bibigiPct}%` }} /></div>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      </Section>

      <Section title="📉 효율 변화 (추세)">
        <ExpVelocityDashboard records={records} />
      </Section>
    </div>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  gold: 'bg-gold-dim text-gold',
  green: 'bg-success-dim text-success',
  red: 'bg-danger-dim text-danger',
} as const;

function StatCard({ icon: Icon, tone, label, value }: { icon: typeof BarChart3; tone: keyof typeof TONE_CLASS; label: string; value: string }) {
  return (
    <Card className="p-5">
      <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
        <Icon size={15} />
      </span>
      <div className="mb-1.5 text-[11px] text-text-sub">{label}</div>
      <div className="font-display text-[22px] font-bold text-white">{value}</div>
    </Card>
  );
}

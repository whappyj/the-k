import { ListChecks, Sparkles, Timer, Coins, Swords, BarChart3, TrendingUp, Wallet } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardTitle, CardDescription, InteractiveCard } from '@/components/ui/card';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { EmptyCell } from '@/components/common/EmptyState';
import { ExpDashboardWidget } from '@/components/analysis/ExpDashboardWidget';
import type { Route } from '@/types';
import { todayStr } from '@/utils/date';

const QUICK_NAV: { route: Route; icon: typeof Coins; title: string; desc: string }[] = [
  { route: 'estimate', icon: Coins, title: '제작 비교 견적', desc: 'A/B 조건별 제작비 비교' },
  { route: 'experience', icon: Swords, title: '경험치 기록', desc: '사냥 세션 기록 추가' },
  { route: 'analysis', icon: BarChart3, title: '경험치 분석', desc: '사냥터/파티 순위 분석' },
  { route: 'calculator', icon: TrendingUp, title: '레벨업 시뮬레이터', desc: '목표 레벨까지 예상 소요일 계산' },
  { route: 'adenaPurchase', icon: Wallet, title: '아데나 매입', desc: '매입 관리 (준비 중)' },
];

export function HomePage() {
  const { data } = useAppData();
  const { formatNumber, formatPercent, formatDuration } = useFormatters();

  const today = todayStr();
  const todayRecords = data.experienceRecords.filter((r) => r.startDate === today);
  const todayGained = todayRecords.reduce((s, r) => s + r.gainExp, 0);
  const todaySeconds = todayRecords.reduce((s, r) => s + r.playTime, 0);

  const recent = [...data.experienceRecords]
    .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())
    .slice(0, 3);

  const hasEstimateInput = data.estimate.rateA > 0 || data.estimate.rateB > 0;

  return (
    <div id="page-home">
      <PageHeader title="홈" subtitle="오늘의 사냥 요약과 최근 기록을 한눈에 확인하세요." />

      <div className="mb-8">
        <ExpDashboardWidget records={data.experienceRecords} goal={data.expGoal} />
      </div>

      <Section title="오늘의 요약">
        <div className="grid grid-cols-3 gap-5 max-[720px]:grid-cols-1">
          <Card>
            <StatIcon icon={ListChecks} tone="primary" />
            <div className="mb-1.5 text-[13px] text-text-sub">오늘 기록 수</div>
            <div className="font-display text-[28px] font-bold tracking-tight">{todayRecords.length}건</div>
          </Card>
          <Card>
            <StatIcon icon={Sparkles} tone="warning" />
            <div className="mb-1.5 text-[13px] text-text-sub">오늘 획득 경험치</div>
            <div className="font-display text-[28px] font-bold tracking-tight">{formatPercent(todayGained)}</div>
          </Card>
          <Card>
            <StatIcon icon={Timer} tone="success" />
            <div className="mb-1.5 text-[13px] text-text-sub">오늘 사냥 시간</div>
            <div className="font-display text-[28px] font-bold tracking-tight">{formatDuration(todaySeconds)}</div>
          </Card>
        </div>
      </Section>

      <div className="mb-10 grid grid-cols-2 gap-5 max-[720px]:grid-cols-1">
        <Card>
          <CardTitle>최근 기록</CardTitle>
          <CardDescription>가장 최근 경험치 기록 3건</CardDescription>
          {recent.length ? (
            recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-border/[0.08] py-2.5 text-[13px] last:border-none">
                <span>{r.huntArea}</span>
                <span className="font-semibold">{formatPercent(r.expPerHour)}/h</span>
              </div>
            ))
          ) : (
            <EmptyCell>최근 경험치 기록이 없습니다.</EmptyCell>
          )}
        </Card>
        <Card>
          <CardTitle>최근 제작 견적</CardTitle>
          <CardDescription>마지막으로 입력한 A/B 견적 조건</CardDescription>
          {hasEstimateInput ? (
            <>
              <div className="flex items-center justify-between border-b border-border/[0.08] py-2.5 text-[13px]">
                <span>A 환율</span>
                <span className="font-semibold">{formatNumber(data.estimate.rateA)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span>B 환율</span>
                <span className="font-semibold">{formatNumber(data.estimate.rateB)}</span>
              </div>
            </>
          ) : (
            <EmptyCell>저장된 제작 견적이 없습니다.</EmptyCell>
          )}
        </Card>
      </div>

      <Section title="빠른 이동">
        <div className="grid grid-cols-5 gap-5 max-[1280px]:grid-cols-3 max-[720px]:grid-cols-2">
          {QUICK_NAV.map(({ route, icon: Icon, title, desc }) => (
            <InteractiveCard key={route} onClick={() => (window.location.hash = `#${route}`)} className="flex flex-col gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-white/[0.05] text-primary">
                <Icon size={20} />
              </div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-text-sub">{desc}</div>
            </InteractiveCard>
          ))}
        </div>
      </Section>
    </div>
  );
}

function StatIcon({ icon: Icon, tone }: { icon: typeof ListChecks; tone: 'primary' | 'success' | 'warning' }) {
  const toneClass = { primary: 'bg-primary-dim text-primary', success: 'bg-success-dim text-success', warning: 'bg-warning-dim text-warning' }[tone];
  return (
    <div className={`mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] ${toneClass}`}>
      <Icon size={18} />
    </div>
  );
}

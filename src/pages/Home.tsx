import { ListChecks, Sparkles, Timer, Coins, Swords, BarChart3, TrendingUp, Wallet, Scale, MapPin, Gauge, Save, PencilLine, History } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardTitle, CardDescription, InteractiveCard } from '@/components/ui/card';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_HOME } from '@/lib/helpContent';
import { EmptyCell } from '@/components/common/EmptyState';
import { computeVelocityWindows, computeEta } from '@/lib/expVelocity';
import type { Route } from '@/types';
import { todayStr } from '@/utils/date';

const QUICK_NAV: { route: Route; icon: typeof Coins; title: string; desc: string }[] = [
  { route: 'estimate', icon: Coins, title: '제작 비교 견적', desc: 'A/B 조건별 제작비 비교' },
  { route: 'experience', icon: Swords, title: '경험치 기록', desc: '사냥 세션 기록 추가' },
  { route: 'analysis', icon: ListChecks, title: '기록 목록', desc: '저장된 기록 검색·관리' },
  { route: 'compare', icon: Scale, title: '비교', desc: '사냥터별 효율 랭킹' },
  { route: 'huntAreaEfficiency', icon: MapPin, title: '사냥터 효율', desc: '사냥터별 측정 이력 비교' },
  { route: 'statistics', icon: BarChart3, title: '통계', desc: '요일·시간대별 경향 분석' },
  { route: 'calculator', icon: TrendingUp, title: '레벨업 시뮬레이터', desc: '목표 레벨까지 예상 소요일 계산' },
  { route: 'adenaPurchase', icon: Wallet, title: '아데나 매입', desc: '매입 관리' },
];

/**
 * pages/Home.tsx
 * THE K의 대시보드 화면. PC(1920×1080) 기준 Desktop 프로그램 느낌으로 재구성했다 —
 * 상단 경험치 대시보드(한 줄 6항목) → 오늘 요약(4카드) → 최근 기록/최근 견적(2열, 높이 동일)
 * → 빠른 이동(2행 그리드) → 최근 활동 순서. 전부 이미 저장된 데이터(experienceRecords/
 * estimate/lastSavedLabel)를 그대로 읽어 표시만 할 뿐, calculations.ts나 appDataReducer.ts는
 * 전혀 건드리지 않는다 — expVelocity.ts의 기존 계산 함수(computeVelocityWindows/computeEta)도
 * 새로 만들지 않고 그대로 재사용한다.
 */
export function HomePage() {
  const { data, lastSavedLabel } = useAppData();
  const { formatNumber, formatPercent, formatDuration } = useFormatters();

  const today = todayStr();
  const records = data.experienceRecords;
  const todayRecords = records.filter((r) => r.startDate === today);
  const todayGained = todayRecords.reduce((s, r) => s + r.gainExp, 0);
  const todaySeconds = todayRecords.reduce((s, r) => s + r.playTime, 0);

  const recentByStart = [...records].sort(
    (a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime()
  );
  const recent = recentByStart.slice(0, 5);
  const latest = recentByStart[0] ?? null;

  const recentByUpdate = [...records].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const lastModified = recentByUpdate[0] ?? null;

  const windows = records.length ? computeVelocityWindows(records) : null;
  const eta = latest && windows ? computeEta(latest.endExp, windows[0]?.perDayRate ?? 0) : null;

  const hasEstimateInput = data.estimate.rateA > 0 || data.estimate.rateB > 0;
  const progressPercent = latest ? latest.endExp : 0;

  return (
    <div id="page-home">
      <PageHeader title="홈" actions={<HelpButton content={HELP_HOME} />} />

      {/* 경험치 대시보드 — 한 줄 6항목 */}
      <Card className="mb-6 rounded-2xl border-[#1D2530] bg-gradient-to-br from-primary/[0.08] to-transparent p-8">
        <div className="mb-4 flex items-center gap-2 text-[14px] font-bold text-white">
          <Gauge size={16} className="text-primary" />
          경험치 대시보드
        </div>
        {records.length && latest && windows && eta ? (
          <div className="grid grid-cols-6 gap-6 max-[1400px]:grid-cols-3 max-[720px]:grid-cols-2">
            <DashboardItem label="현재 레벨" value={`Lv ${latest.endLevel}`} />
            <DashboardItem label="현재 경험치" value={formatPercent(latest.endExp)} />
            <DashboardItem label="오늘 획득 경험치" value={`+${formatPercent(todayGained)}`} tone="text-success" />
            <DashboardItem label="최근 24시간" value={`+${formatPercent(windows[0]?.gainPercent ?? 0)}`} />
            <DashboardItem label="최근 7일 평균" value={`${formatPercent(windows[1]?.perDayRate ?? 0)}/일`} />
            <DashboardItem label="예상 레벨업 시간" value={eta.days !== null ? `약 ${eta.days.toFixed(1)}일` : '예측 불가'} tone="text-primary" />
          </div>
        ) : (
          <EmptyCell>경험치 기록이 쌓이면 대시보드가 표시됩니다.</EmptyCell>
        )}
      </Card>

      <Section title="오늘의 요약">
        <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[480px]:grid-cols-1">
          <Card className="p-6">
            <StatIcon icon={ListChecks} tone="primary" />
            <div className="mb-1 text-[13px] text-text-sub">오늘 기록</div>
            <div className="font-display text-[24px] font-bold tracking-tight">{todayRecords.length}건</div>
          </Card>
          <Card className="p-6">
            <StatIcon icon={Sparkles} tone="success" />
            <div className="mb-1 text-[13px] text-text-sub">오늘 획득</div>
            <div className="font-display text-[24px] font-bold tracking-tight">{formatPercent(todayGained)}</div>
          </Card>
          <Card className="p-6">
            <StatIcon icon={Timer} tone="primary" />
            <div className="mb-1 text-[13px] text-text-sub">사냥 시간</div>
            <div className="font-display text-[24px] font-bold tracking-tight">{formatDuration(todaySeconds)}</div>
          </Card>
          <Card className="p-6">
            <StatIcon icon={Gauge} tone="success" />
            <div className="mb-1 text-[13px] text-text-sub">진행률</div>
            <div className="font-display text-[24px] font-bold tracking-tight">{formatPercent(progressPercent)}</div>
          </Card>
        </div>
      </Section>

      <div className="mb-12 grid grid-cols-2 gap-6 max-[1100px]:grid-cols-1">
        <Card className="flex min-h-[360px] flex-col p-8">
          <CardTitle>최근 경험치 기록</CardTitle>
          <CardDescription>가장 최근 경험치 기록 {recent.length}건</CardDescription>
          <div className="flex-1">
            {recent.length ? (
              recent.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-4 border-b border-border/[0.08] py-3 text-[14px] last:border-none">
                  <span className="min-w-0 flex-1 break-words">{r.huntArea}</span>
                  <span className="shrink-0 font-semibold text-primary">{formatPercent(r.expPerHour)}/h</span>
                </div>
              ))
            ) : (
              <EmptyCell>최근 경험치 기록이 없습니다.</EmptyCell>
            )}
          </div>
        </Card>
        <Card className="flex min-h-[360px] flex-col p-8">
          <CardTitle>최근 제작 견적</CardTitle>
          <CardDescription>마지막으로 입력한 A/B 견적 조건</CardDescription>
          <div className="flex-1">
            {hasEstimateInput ? (
              <>
                <div className="flex items-center justify-between border-b border-border/[0.08] py-3 text-[14px]">
                  <span>A 환율</span>
                  <span className="font-semibold text-primary">{formatNumber(data.estimate.rateA)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/[0.08] py-3 text-[14px] last:border-none">
                  <span>B 환율</span>
                  <span className="font-semibold text-primary">{formatNumber(data.estimate.rateB)}</span>
                </div>
                <div className="flex items-center justify-between py-3 text-[14px]">
                  <span>선택된 재료 수</span>
                  <span className="font-semibold">{data.estimate.materials.length}개</span>
                </div>
              </>
            ) : (
              <EmptyCell>저장된 제작 견적이 없습니다.</EmptyCell>
            )}
          </div>
        </Card>
      </div>

      <Section title="빠른 이동">
        <div className="grid grid-cols-4 gap-6 max-[1280px]:grid-cols-2">
          {QUICK_NAV.map(({ route, icon: Icon, title, desc }) => (
            <InteractiveCard key={route} onClick={() => (window.location.hash = `#${route}`)} className="flex flex-col gap-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary-dim text-primary">
                <Icon size={20} />
              </div>
              <div className="text-[15px] font-semibold">{title}</div>
              <div className="text-[12.5px] text-text-sub">{desc}</div>
            </InteractiveCard>
          ))}
        </div>
      </Section>

      <Section title="최근 활동">
        <Card className="p-8">
          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
            <ActivityItem
              icon={History}
              label="최근 기록"
              value={latest ? `${latest.huntArea} · ${formatPercent(latest.expPerHour)}/h` : '기록 없음'}
            />
            <ActivityItem
              icon={PencilLine}
              label="마지막 수정"
              value={lastModified ? `${lastModified.huntArea} · ${lastModified.startDate}` : '수정 기록 없음'}
            />
            <ActivityItem icon={Save} label="마지막 저장" value={lastSavedLabel} />
          </div>
        </Card>
      </Section>
    </div>
  );
}

function DashboardItem({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] text-text-sub">{label}</div>
      <div className={`font-display text-[26px] font-bold ${tone ?? 'text-white'}`}>{value}</div>
    </div>
  );
}

function StatIcon({ icon: Icon, tone }: { icon: typeof ListChecks; tone: 'primary' | 'success' }) {
  const toneClass = { primary: 'bg-primary-dim text-primary', success: 'bg-success-dim text-success' }[tone];
  return (
    <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] ${toneClass}`}>
      <Icon size={18} />
    </div>
  );
}

function ActivityItem({ icon: Icon, label, value }: { icon: typeof Save; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-[#1D2530] bg-white/[0.02] px-6 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-dim text-primary">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-text-sub">{label}</div>
        <div className="break-words text-[13.5px] font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

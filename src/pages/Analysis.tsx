import { useAppData } from '@/hooks/useAppData';
import { usePendingEdit } from '@/hooks/usePendingEdit';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { HuntAreaCompareCards } from '@/components/analysis/HuntAreaCompareCards';
import { BestCondition } from '@/components/analysis/BestCondition';
import { ExpMultiplierSimulator } from '@/components/analysis/ExpMultiplierSimulator';
import { ExpVelocityDashboard } from '@/components/analysis/ExpVelocityDashboard';
import { ExpGoalCard } from '@/components/analysis/ExpGoalCard';
import { ExpSimulator } from '@/components/analysis/ExpSimulator';
import { AnalysisRecentList } from '@/components/analysis/RecentList';
import { EmptyCell } from '@/components/common/EmptyState';

/**
 * pages/Analysis.tsx
 * "연구" 목적의 화면 — 신규 사냥터가 나왔을 때 어디가 제일 좋은지, 어떤 조합이 좋은지,
 * 기존 사냥터보다 얼마나 좋은지를 3초 안에 판단할 수 있어야 한다.
 * 막대/선/원형 그래프는 전혀 쓰지 않는다. 순위는 🏆/🥈/⚠ 아이콘과 카드 색상으로만 표시한다.
 * 실험 변수(변신/인형/버프/용티/축복/이벤트)는 애초에 데이터 모델에 없다 — 취급하지 않는다.
 */
export function AnalysisPage() {
  const { data } = useAppData();
  const { setPendingEditId } = usePendingEdit();
  const records = data.experienceRecords;

  const latest = [...records].sort(
    (a, b) => new Date(`${b.endDate}T${b.endTime}`).getTime() - new Date(`${a.endDate}T${a.endTime}`).getTime()
  )[0];

  const handleSelectRecord = (id: string) => {
    setPendingEditId(id);
    window.location.hash = '#experience';
  };

  if (!records.length) {
    return (
      <div id="page-analysis">
        <PageHeader title="📊 경험치 분석" subtitle="사냥터·조합별 효율을 3초 안에 비교합니다." />
        <EmptyCell>경험치 기록이 쌓이면 사냥터별 비교와 추천이 여기 표시됩니다. 먼저 경험치 기록 페이지에서 기록을 입력해주세요.</EmptyCell>
      </div>
    );
  }

  return (
    <div id="page-analysis">
      <PageHeader title="📊 경험치 분석" subtitle="사냥터·조합별 효율을 3초 안에 비교합니다. (그래프 없이 카드와 순위 아이콘으로만 표시)" />

      <Section title="🗺 사냥터별 효율 비교">
        <HuntAreaCompareCards records={records} />
      </Section>

      <Section title="🎯 지금 가장 좋은 조건">
        <BestCondition records={records} />
      </Section>

      <Section title="🧮 30분 결과로 시간대별 예상치 계산">
        <ExpMultiplierSimulator />
      </Section>

      <Section title="⏱ 나의 획득 속도">
        <ExpVelocityDashboard records={records} />
      </Section>

      <Section title="🏁 목표 달성 계산">
        <ExpGoalCard records={records} currentExpPercent={latest?.endExp ?? 0} />
      </Section>

      <Section title="🔮 목표 경험치까지 남은 시간">
        <ExpSimulator records={records} />
      </Section>

      <Section title="📜 최근 기록">
        <AnalysisRecentList records={records} onSelect={handleSelectRecord} />
      </Section>
    </div>
  );
}

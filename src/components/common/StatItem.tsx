/**
 * components/common/StatItem.tsx
 * "라벨 위 / 값 아래" 형태의 작은 통계 표시 블록.
 * calculator/analysis의 여러 카드(RealtimeResult, GoalCard, SimulationCard,
 * ExpSimulator, LevelUpEstimate)에 거의 동일하게 중복 정의돼 있던 것을 통합했다.
 */
export function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mb-1.5 text-xs text-text-sub">{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}

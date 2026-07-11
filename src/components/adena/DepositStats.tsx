import { Card } from '@/components/ui/card';
import type { PurchaseRecord } from '@/types';

interface DepositStatsProps {
  records: PurchaseRecord[];
}

/** "전체 건수"는 미입금+입금완료의 합과 같아 중복 정보라 제거했다 (화면을 더 넓게 쓰기 위함). */
export function DepositStats({ records }: DepositStatsProps) {
  const total = records.length;
  const completed = records.filter((r) => r.depositCompleted).length;
  const pending = total - completed;

  return (
    <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1">
      <Card className="rounded-2xl border-white/[0.06] !py-3.5 border-t-0 bg-warning/[0.05]">
        <div className="mb-1 text-xs text-text-sub">미입금</div>
        <div className="font-display text-xl font-bold text-warning">{pending}건</div>
      </Card>
      <Card className="rounded-2xl border-white/[0.06] !py-3.5 border-t-0 bg-success/[0.05]">
        <div className="mb-1 text-xs text-text-sub">입금완료 (전체 {total}건)</div>
        <div className="font-display text-xl font-bold text-success">{completed}건</div>
      </Card>
    </div>
  );
}

import { useMemo, useState } from 'react';
import type { PurchaseRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';
import { DepositStats } from '@/components/adena/DepositStats';
import { formatAdenaAmount } from '@/utils/format';
import { cn } from '@/utils/cn';

interface DepositManagementViewProps {
  records: PurchaseRecord[];
  onToggleDeposit: (id: string, completed: boolean) => void;
}

type DepositFilter = 'pending' | 'completed';

const FILTER_LABEL: Record<DepositFilter, string> = { pending: '미입금 목록', completed: '입금완료 목록' };

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

/**
 * components/adena/DepositManagementView.tsx ("입금 관리")
 * 매입 등록 화면과 완전히 분리된 입금/미입금 관리 전용 화면. 여기서만 입금 여부를
 * 체크박스로 토글한다(updatePurchaseRecord는 기존 그대로 재사용, 새 계산식 없음).
 */
export function DepositManagementView({ records, onToggleDeposit }: DepositManagementViewProps) {
  const [filter, setFilter] = useState<DepositFilter>('pending');

  const visible = useMemo(() => {
    const filtered = records.filter((r) => (filter === 'pending' ? !r.depositCompleted : r.depositCompleted));
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, filter]);

  return (
    <div>
      <div className="mb-4">
        <DepositStats records={records} />
      </div>

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] p-[3px]">
        {(Object.keys(FILTER_LABEL) as DepositFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn('h-[38px] rounded-full px-5 text-[13px] font-semibold text-text-sub transition-colors', filter === f && 'bg-primary text-white')}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyCell>{filter === 'pending' ? '미입금 기록이 없습니다.' : '입금완료 기록이 없습니다.'}</EmptyCell>
      ) : (
        <Card className="overflow-x-auto rounded-2xl border-[#1D2530] bg-[#0B1016] px-5 py-2">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="w-16 px-2 py-2.5 text-center text-xs font-semibold text-text-sub">입금</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-sub">아이디</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-text-sub">수량</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-text-sub">금액</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-sub">등록 시간</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-border/[0.08] last:border-none">
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.depositCompleted}
                      onChange={(e) => onToggleDeposit(r.id, e.target.checked)}
                      className="h-[18px] w-[18px] cursor-pointer accent-primary"
                      aria-label={`${r.accountId} 입금 여부`}
                    />
                  </td>
                  <td className="px-2 py-3 font-semibold">{r.accountId}</td>
                  <td className="px-2 py-3 text-right font-display font-bold">{formatAdenaAmount(r.amount)}</td>
                  <td className="px-2 py-3 text-right font-display text-text-sub">{r.cashAmount.toLocaleString('ko-KR')}원</td>
                  <td className="px-2 py-3 text-text-faint">{formatTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { PurchaseRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyCell } from '@/components/common/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import { cn } from '@/utils/cn';

interface PurchaseRecordTableProps {
  records: PurchaseRecord[];
  editingId: string | null;
  onToggleDeposit: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

type DepositFilter = 'all' | 'pending' | 'completed';

const FILTER_LABEL: Record<DepositFilter, string> = { all: '전체', pending: '미입금', completed: '입금완료' };

/** 비고 컬럼은 "환율(1만당) × 수량(만)"으로 자동 계산해 읽기전용으로 표시한다.
 *  입금 여부는 체크박스로 즉시 토글되어 LocalStorage에 저장된다 (onToggleDeposit -> updatePurchaseRecord). */
export function PurchaseRecordTable({ records, editingId, onToggleDeposit, onEdit, onDelete }: PurchaseRecordTableProps) {
  const { confirm } = useConfirm();
  const [filter, setFilter] = useState<DepositFilter>('all');

  const handleDelete = async (id: string, accountId: string) => {
    if (await confirm(`"${accountId}" 매입 기록을 삭제하시겠습니까?`)) onDelete(id);
  };

  const visibleRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      if (filter === 'pending') return !r.depositCompleted;
      if (filter === 'completed') return r.depositCompleted;
      return true;
    });
    // 미입금을 먼저, 입금완료를 아래로. 각 그룹 내에서는 최근 등록순을 유지한다.
    return [...filtered].sort((a, b) => {
      if (a.depositCompleted !== b.depositCompleted) return a.depositCompleted ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [records, filter]);

  return (
    <div>
      <div className="mb-3.5 inline-flex flex-wrap gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] p-[3px]">
        {(Object.keys(FILTER_LABEL) as DepositFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn('h-[34px] rounded-full px-4 text-[13px] font-semibold text-text-sub transition-colors', filter === f && 'bg-primary text-white')}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <EmptyCell>등록된 매입 기록이 없습니다. 위에서 아이디와 수량을 입력해 추가해보세요.</EmptyCell>
      ) : visibleRecords.length === 0 ? (
        <EmptyCell>조건에 맞는 기록이 없습니다.</EmptyCell>
      ) : (
        <Card className="overflow-x-auto rounded-[24px] border-white/[0.06] px-5 py-2">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="w-16 px-2 py-2.5 text-center text-xs font-semibold text-text-sub">입금</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-sub">아이디</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-text-sub">수량 (만)</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-sub">비고 (자동계산)</th>
                <th className="w-24 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-border/[0.08] last:border-none',
                    r.id === editingId ? 'bg-primary-dim' : r.depositCompleted ? 'bg-success/[0.05]' : undefined
                  )}
                >
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.depositCompleted}
                      onChange={(e) => onToggleDeposit(r.id, e.target.checked)}
                      className="h-[18px] w-[18px] cursor-pointer accent-primary"
                      aria-label={`${r.accountId} 입금 여부`}
                    />
                  </td>
                  <td className="px-2 py-3 font-semibold">
                    <div className="flex items-center gap-1.5">
                      {r.accountId}
                      {r.depositCompleted && <Badge variant="success">입금완료</Badge>}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right font-display">{r.amount.toLocaleString('ko-KR')}</td>
                  <td className="px-2 py-3 font-display text-text-sub">{r.cashAmount.toLocaleString('ko-KR')}원</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="수정" onClick={() => onEdit(r.id)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="삭제" className="text-danger" onClick={() => handleDelete(r.id, r.accountId)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

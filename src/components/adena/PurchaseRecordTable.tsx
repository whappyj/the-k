import { Pencil, Trash2 } from 'lucide-react';
import type { PurchaseRecord } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyCell } from '@/components/common/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import { formatAdenaAmount } from '@/utils/format';
import { cn } from '@/utils/cn';

interface PurchaseRecordTableProps {
  records: PurchaseRecord[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** true면 OBS 레이아웃용 큰 글씨/큰 행 높이 스타일을 쓴다. */
  large?: boolean;
  /** true면 각 행에 입금 상태 배지를 보여준다(기본 매입 등록 화면에서는 상태만 참고용으로 표시, 필터는 없음). */
  showStatus?: boolean;
}

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
 * 매입 등록 화면(및 OBS 레이아웃)에서 쓰는 목록 테이블. 입금/미입금 필터 탭은 여기 없다
 * (별도 "입금 관리" 화면으로 분리됨 — DepositManagementView.tsx). 번호/아이디/수량/금액/
 * 등록시간/비고/관리(수정·삭제) 컬럼을 보여주며, showStatus가 true면 상태 배지만 참고로 곁들인다.
 */
export function PurchaseRecordTable({ records, editingId, onEdit, onDelete, large, showStatus = true }: PurchaseRecordTableProps) {
  const { confirm } = useConfirm();

  const handleDelete = async (id: string, accountId: string) => {
    if (await confirm(`"${accountId}" 매입 기록을 삭제하시겠습니까?`)) onDelete(id);
  };

  // 최근 등록순으로 표시
  const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (records.length === 0) {
    return <EmptyCell>등록된 매입 기록이 없습니다. 위에서 아이디와 수량을 입력해 추가해보세요.</EmptyCell>;
  }

  const cellPad = large ? 'py-4' : 'py-3';
  const textSize = large ? 'text-[16px]' : 'text-[13px]';
  const headSize = large ? 'text-[13px]' : 'text-xs';

  return (
    <Card className={cn('overflow-x-auto rounded-2xl border-[#1D2530] bg-[#0B1016] px-6 py-2', large && 'px-8')}>
      <table className={cn('w-full min-w-[640px] border-collapse', textSize)}>
        <thead>
          <tr>
            <th className={cn('w-14 px-2 text-left font-semibold text-text-sub', headSize, cellPad)}>번호</th>
            <th className={cn('px-2 text-left font-semibold text-text-sub', headSize, cellPad)}>아이디</th>
            <th className={cn('px-2 text-right font-semibold text-text-sub', headSize, cellPad)}>수량 (만 아데나)</th>
            <th className={cn('px-2 text-right font-semibold text-text-sub', headSize, cellPad)}>매입금액</th>
            <th className={cn('px-2 text-left font-semibold text-text-sub', headSize, cellPad)}>등록 시간</th>
            <th className={cn('px-2 text-left font-semibold text-text-sub', headSize, cellPad)}>비고</th>
            <th className={cn('w-24 px-2', cellPad)} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.id}
              className={cn('border-b border-border/[0.08] last:border-none', r.id === editingId ? 'bg-primary-dim' : r.depositCompleted && showStatus ? 'bg-success/[0.05]' : undefined)}
            >
              <td className={cn('px-2 text-text-faint', cellPad)}>{i + 1}</td>
              <td className={cn('px-2 font-semibold', cellPad)}>{r.accountId}</td>
              <td className={cn('px-2 text-right font-display font-bold', cellPad)}>{formatAdenaAmount(r.amount)}</td>
              <td className={cn('px-2 text-right font-display text-text-sub', cellPad)}>{r.cashAmount.toLocaleString('ko-KR')}원</td>
              <td className={cn('px-2 text-text-faint', cellPad)}>{formatTime(r.createdAt)}</td>
              <td className={cn('px-2', cellPad)}>
                {showStatus && r.depositCompleted ? <Badge variant="success">입금 완료</Badge> : <span className="text-text-faint">{r.memo || '-'}</span>}
              </td>
              <td className={cn('px-2', cellPad)}>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label="수정" onClick={() => onEdit(r.id)}>
                    <Pencil size={large ? 18 : 16} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="삭제" className="text-danger" onClick={() => handleDelete(r.id, r.accountId)}>
                    <Trash2 size={large ? 18 : 16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

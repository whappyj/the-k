import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PurchaseRecordFormProps {
  accountId: string;
  amount: string;
  onChangeAccountId: (v: string) => void;
  onChangeAmount: (v: string) => void;
  isEditing: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
  /** 환율 × 수량으로 계산된 비고 미리보기 (읽기전용). */
  previewCashAmount: number;
  /** 값이 바뀔 때마다 아이디 입력창에 포커스를 준다 (추가 완료 후, 수정모드 진입 시 등). */
  focusSignal: number;
}

/**
 * 아이디 입력 후 Enter → 수량 필드로 이동, 수량 필드에서 Enter → 추가/수정 실행.
 * 비고(= 환율 × 수량)는 입력하는 즉시 자동 계산되어 미리보기로 보여준다.
 */
export function PurchaseRecordForm({
  accountId,
  amount,
  onChangeAccountId,
  onChangeAmount,
  isEditing,
  onSubmit,
  onCancelEdit,
  previewCashAmount,
  focusSignal,
}: PurchaseRecordFormProps) {
  const accountIdRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    accountIdRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  const handleAccountKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const handleAmountKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Card className="rounded-2xl border-[#2A2F38] bg-[#171A20] p-6 sm:p-7">
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-3 max-[720px]:grid-cols-1">
        <div>
          <Label className="mb-1.5 block">아이디</Label>
          <Input
            ref={accountIdRef}
            value={accountId}
            placeholder="판매자 아이디"
            onChange={(e) => onChangeAccountId(e.target.value)}
            onKeyDown={handleAccountKeyDown}
            className="h-11 rounded-xl border-[#2A2F38] bg-white/[0.04]"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">수량 (만)</Label>
          <Input
            ref={amountRef}
            type="number"
            min={0}
            value={amount}
            placeholder="0"
            onChange={(e) => onChangeAmount(e.target.value)}
            onKeyDown={handleAmountKeyDown}
            className="h-11 rounded-xl border-[#2A2F38] bg-white/[0.04]"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">비고 (자동계산)</Label>
          <div className="flex h-11 items-center rounded-xl border border-[#2A2F38] bg-white/[0.03] px-3.5 text-text-sub">
            {previewCashAmount.toLocaleString('ko-KR')}원
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing && (
            <Button variant="secondary" className="rounded-xl" onClick={onCancelEdit}>
              <X size={18} />
              취소
            </Button>
          )}
          <Button variant="primary" className="rounded-xl" onClick={onSubmit}>
            {isEditing ? <Check size={18} /> : <Plus size={18} />}
            {isEditing ? '수정 완료' : '추가'}
          </Button>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-text-faint">아이디 입력 후 Enter → 수량으로 이동, 수량에서 Enter → 바로 추가됩니다.</div>
    </Card>
  );
}

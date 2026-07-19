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
  memo: string;
  onChangeAccountId: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangeMemo: (v: string) => void;
  isEditing: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
  /** 환율 × 수량으로 계산된 비고 미리보기 (읽기전용). */
  previewCashAmount: number;
  /** 값이 바뀔 때마다 아이디 입력창에 포커스를 준다 (추가 완료 후, 수정모드 진입 시 등). */
  focusSignal: number;
  /** true면 OBS 레이아웃용 큰 글씨/큰 입력창 스타일을 쓴다. */
  large?: boolean;
}

/**
 * 아이디 입력 후 Enter → 수량 필드로 이동, 수량 필드에서 Enter → 추가/수정 실행.
 * 비고(= 환율 × 수량)는 입력하는 즉시 자동 계산되어 미리보기로 보여준다.
 */
export function PurchaseRecordForm({
  accountId,
  amount,
  memo,
  onChangeAccountId,
  onChangeAmount,
  onChangeMemo,
  isEditing,
  onSubmit,
  onCancelEdit,
  previewCashAmount,
  focusSignal,
  large,
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

  const inputHeight = large ? 'h-14 text-[16px]' : 'h-11';
  const labelSize = large ? 'text-[14px]' : undefined;

  return (
    <Card className="rounded-2xl border-[#1D2530] bg-[#0B1016] p-6 sm:p-7">
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-3 max-[720px]:grid-cols-1">
        <div>
          <Label className={labelSize ? `mb-1.5 block ${labelSize}` : 'mb-1.5 block'}>아이디</Label>
          <Input
            ref={accountIdRef}
            value={accountId}
            placeholder="아이디 입력"
            onChange={(e) => onChangeAccountId(e.target.value)}
            onKeyDown={handleAccountKeyDown}
            className={`rounded-xl border-[#1D2530] bg-white/[0.04] ${inputHeight}`}
          />
        </div>
        <div>
          <Label className={labelSize ? `mb-1.5 block ${labelSize}` : 'mb-1.5 block'}>수량 (만 아데나)</Label>
          <Input
            ref={amountRef}
            type="number"
            min={0}
            value={amount}
            placeholder="0"
            onChange={(e) => onChangeAmount(e.target.value)}
            onKeyDown={handleAmountKeyDown}
            className={`rounded-xl border-[#1D2530] bg-white/[0.04] ${inputHeight}`}
          />
        </div>
        <div>
          <Label className={labelSize ? `mb-1.5 block ${labelSize}` : 'mb-1.5 block'}>비고 (선택)</Label>
          <Input
            value={memo}
            placeholder="비고 입력 (선택)"
            onChange={(e) => onChangeMemo(e.target.value)}
            onKeyDown={handleAmountKeyDown}
            className={`rounded-xl border-[#1D2530] bg-white/[0.04] ${inputHeight}`}
          />
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
            {isEditing ? '수정 완료' : '매입 추가'}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-text-faint">
        <span>아이디 → 수량 → Enter</span>
        <span>예상 금액: {previewCashAmount.toLocaleString('ko-KR')}원</span>
      </div>
    </Card>
  );
}

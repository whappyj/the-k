import type { PurchaseRecord, PurchaseSettings } from '@/types';
import { Card } from '@/components/ui/card';
import { formatAdenaAmount } from '@/utils/format';

interface PurchaseTotalsBarProps {
  records: PurchaseRecord[];
  settings: PurchaseSettings;
}

/**
 * components/adena/PurchaseTotalsBar.tsx
 * 매입 등록 화면 하단의 합계 요약(전체 매입 건수/총 매입량/총 매입금액/남은 목표량/남은
 * 목표금액). 전부 이미 저장된 purchaseRecords/purchaseSettings를 합산만 한 것으로,
 * 새 계산식은 없다(환율×수량은 기존 저장 시점에 이미 계산된 cashAmount를 그대로 합산).
 */
export function PurchaseTotalsBar({ records, settings }: PurchaseTotalsBarProps) {
  const totalCount = records.length;
  const totalAmount = records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalCash = records.reduce((s, r) => s + (Number(r.cashAmount) || 0), 0);
  const target = Number(settings.targetAmount) || 0;
  const current = Number(settings.currentAmount) || 0;
  const rate = Number(settings.rate) || 0;
  const remainingAmount = Math.max(0, target - current);
  const remainingCash = remainingAmount * rate;

  return (
    <Card className="mt-5 rounded-2xl border-[#1D2530] bg-[#0B1016] p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 min-[720px]:grid-cols-5">
        <TotalItem label="전체 매입 건수" value={`${totalCount}건`} />
        <TotalItem label="총 매입량" value={formatAdenaAmount(totalAmount)} tone="primary" />
        <TotalItem label="총 매입금액" value={`${totalCash.toLocaleString('ko-KR')}원`} tone="gold" />
        <TotalItem label="남은 목표량" value={formatAdenaAmount(remainingAmount)} />
        <TotalItem label="남은 목표금액" value={`${remainingCash.toLocaleString('ko-KR')}원`} />
      </div>
      <div className="mt-4 border-t border-[#1D2530] pt-3 text-[11px] text-text-faint">※ 환율은 1만 아데나 기준입니다. (예: 900원 = 1만 아데나)</div>
    </Card>
  );
}

function TotalItem({ label, value, tone }: { label: string; value: string; tone?: 'primary' | 'gold' }) {
  const color = tone === 'primary' ? 'text-primary' : tone === 'gold' ? 'text-gold' : 'text-white';
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium text-text-sub">{label}</div>
      <div className={`font-display text-xl font-bold sm:text-2xl ${color}`}>{value}</div>
    </div>
  );
}

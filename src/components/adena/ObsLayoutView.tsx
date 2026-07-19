import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { PurchaseRecord, PurchaseSettings } from '@/types';
import { PurchaseRecordForm } from '@/components/adena/PurchaseRecordForm';
import { PurchaseRecordTable } from '@/components/adena/PurchaseRecordTable';
import { formatAdenaAmount } from '@/utils/format';
import { useToast } from '@/hooks/useToast';

interface ObsLayoutViewProps {
  records: PurchaseRecord[];
  settings: PurchaseSettings;
  accountId: string;
  amount: string;
  memo: string;
  onChangeAccountId: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangeMemo: (v: string) => void;
  isEditing: boolean;
  editingId: string | null;
  onSubmit: () => void;
  onCancelEdit: () => void;
  previewCashAmount: number;
  focusSignal: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/**
 * components/adena/ObsLayoutView.tsx ("OBS 레이아웃")
 * 방송 캡처(OBS/SOOP/Streamlabs/XSplit/vMix 브라우저 소스) 전용 화면. 화면 전체를
 * 덮는 오버레이로 띄워 사이드바 없이 전체 폭을 쓴다. 환율/카카오ID/목표량/현재량/진행률
 * 카드는 스크롤해도 항상 상단에 고정(sticky)된다. 입금/미입금 상태·필터는 표시하지 않고
 * (showStatus=false) 매입 등록/수정/삭제는 그대로 가능하다 — 계산·저장 로직은 기존 그대로
 * 재사용할 뿐, 새 계산식을 추가하지 않는다.
 */
export function ObsLayoutView({
  records,
  settings,
  accountId,
  amount,
  memo,
  onChangeAccountId,
  onChangeAmount,
  onChangeMemo,
  isEditing,
  editingId,
  onSubmit,
  onCancelEdit,
  previewCashAmount,
  focusSignal,
  onEdit,
  onDelete,
  onClose,
}: ObsLayoutViewProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const rate = Number(settings.rate) || 0;
  const target = Number(settings.targetAmount) || 0;
  const current = Number(settings.currentAmount) || 0;
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const handleCopy = async () => {
    const id = settings.kakaoId?.trim();
    if (!id) return showToast('복사할 카카오톡 ID가 없습니다.', 'danger');
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      showToast('✓ 복사 완료', 'success', 2000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('복사에 실패했습니다.', 'danger');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#06080B]">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6 sm:px-10 sm:py-8">
        {/* 환율/ID/목표/현재/진행률 — 항상 상단 고정 */}
        <div className="sticky top-0 z-10 -mx-6 mb-8 border-b border-[#1D2530] bg-[#06080B]/97 px-6 pb-6 pt-2 backdrop-blur sm:-mx-10 sm:px-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-full bg-gold-dim px-4 py-1.5 text-[13px] font-bold text-gold">최상단 고정 (스크롤해도 항상 보임)</div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1D2530] bg-white/[0.03] px-4 text-[14px] font-semibold text-text-sub hover:bg-white/[0.06]"
            >
              <X size={18} />
              일반 화면으로
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 min-[900px]:grid-cols-5">
            <ObsStat label="환율 (1만 아데나당)">
              <div className="font-display text-[32px] font-bold text-white">{rate.toLocaleString('ko-KR')}<span className="ml-1 text-base font-semibold text-text-sub">원</span></div>
            </ObsStat>
            <ObsStat label="카카오톡 ID">
              <div className="flex items-center gap-2.5">
                <div className="truncate font-display text-[28px] font-bold text-white">{settings.kakaoId || '-'}</div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-[13px] font-semibold ${copied ? 'bg-success/15 text-success' : 'bg-white/[0.06] text-text-sub'}`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? '완료' : '복사'}
                </button>
              </div>
            </ObsStat>
            <ObsStat label="총 매입 목표량">
              <div className="font-display text-[32px] font-bold text-white">{formatAdenaAmount(target)}</div>
            </ObsStat>
            <ObsStat label="현재 매입량">
              <div className="font-display text-[32px] font-bold text-primary">{formatAdenaAmount(current)}</div>
            </ObsStat>
            <ObsStat label="진행률">
              <div className="font-display text-[32px] font-bold text-gold">{progress}%</div>
              <div className="mt-2 h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </ObsStat>
          </div>
        </div>

        {/* 매입 등록/수정/삭제 — OBS 화면에서도 그대로 가능 */}
        <div className="mb-8">
          <PurchaseRecordForm
            accountId={accountId}
            amount={amount}
            memo={memo}
            onChangeAccountId={onChangeAccountId}
            onChangeAmount={onChangeAmount}
            onChangeMemo={onChangeMemo}
            isEditing={isEditing}
            onSubmit={onSubmit}
            onCancelEdit={onCancelEdit}
            previewCashAmount={previewCashAmount}
            focusSignal={focusSignal}
            large
          />
        </div>

        {/* 리스트 — 입금 상태 표시 없음(showStatus=false), 검색창 없이도 찾기 쉽도록 큰 글씨 */}
        <PurchaseRecordTable records={records} editingId={editingId} onEdit={onEdit} onDelete={onDelete} large showStatus={false} />
      </div>
    </div>
  );
}

function ObsStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-text-sub">{label}</div>
      {children}
    </div>
  );
}

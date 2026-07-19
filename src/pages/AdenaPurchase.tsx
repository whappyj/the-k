import { useState } from 'react';
import { Download, Tv, HelpCircle, Radio } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { PurchaseSummaryBar } from '@/components/adena/PurchaseSummaryBar';
import { PurchaseRecordForm } from '@/components/adena/PurchaseRecordForm';
import { PurchaseRecordTable } from '@/components/adena/PurchaseRecordTable';
import { PurchaseTotalsBar } from '@/components/adena/PurchaseTotalsBar';
import { DepositManagementView } from '@/components/adena/DepositManagementView';
import { ObsLayoutView } from '@/components/adena/ObsLayoutView';
import { ExportPanel } from '@/components/adena/ExportPanel';
import { FeatureGuideDialog } from '@/components/adena/FeatureGuideDialog';
import { BroadcastGuideDialog } from '@/components/adena/BroadcastGuideDialog';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import { generateId } from '@/utils/id';
import type { PurchaseSettings, PurchaseRecord } from '@/types';
import { cn } from '@/utils/cn';

type ViewMode = 'register' | 'deposit';

/**
 * pages/AdenaPurchase.tsx
 * 아데나 매입 관리 화면. data.purchaseSettings / data.purchaseRecords와 양방향 바인딩되며,
 * 비고(환율×수량)/남은수량/총사용금액까지 전부 계산되어 실시간으로 반영된다.
 * "매입 등록" / "입금 관리" 두 화면으로 분리하고, 방송 캡처용 "OBS 레이아웃"(전체화면
 * 오버레이)을 추가했다 — 계산·저장 로직은 기존 그대로, UI 구성만 재배치한 것이다.
 */
export function AdenaPurchasePage() {
  const { data } = useAppData();
  const { patchPurchaseSettings, addPurchaseRecord, updatePurchaseRecord, deletePurchaseRecord, importMerge } = useAppDataActions();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('register');
  const [obsOpen, setObsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [featureGuideOpen, setFeatureGuideOpen] = useState(false);
  const [broadcastGuideOpen, setBroadcastGuideOpen] = useState(false);

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);

  const resetForm = () => {
    setAccountId('');
    setAmount('');
    setMemo('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!accountId.trim()) return showToast('아이디를 입력해주세요.', 'danger');
    const amountNumber = Number(amount);
    if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) return showToast('수량을 올바르게 입력해주세요(0보다 큰 숫자).', 'danger');

    // 비고 = 환율(1만당) × 수량(만)
    const cashAmount = data.purchaseSettings.rate * amountNumber;
    const currentAmountNow = Number(data.purchaseSettings.currentAmount) || 0;
    const memoTrimmed = memo.trim();

    if (editingId) {
      const before = data.purchaseRecords.find((r) => r.id === editingId);
      const beforeAmount = before ? Number(before.amount) || 0 : 0;
      updatePurchaseRecord(editingId, { accountId: accountId.trim(), amount: amountNumber, cashAmount, memo: memoTrimmed || undefined });
      // 수정 시 차액만큼 현재 수량을 즉시 재계산한다 (기존 수량 빼고 새 수량 더함).
      patchPurchaseSettings({ currentAmount: currentAmountNow - beforeAmount + amountNumber });
      showToast('매입 기록을 수정했습니다. 현재 수량에 즉시 반영됐습니다.', 'success');
    } else {
      addPurchaseRecord({
        id: generateId(),
        accountId: accountId.trim(),
        amount: amountNumber,
        cashAmount,
        depositCompleted: false,
        createdAt: new Date().toISOString(),
        memo: memoTrimmed || undefined,
      });
      // 매입 등록 = 보유 수량 증가. 새로고침 없이 오늘 현황(현재수량/남은수량/실시간총매입금액)에 즉시 반영된다.
      patchPurchaseSettings({ currentAmount: currentAmountNow + amountNumber });
      showToast('매입 기록을 추가했습니다. 현재 수량에 즉시 반영됐습니다.', 'success');
    }
    resetForm();
    setFocusSignal((n) => n + 1); // 추가/수정 완료 후 아이디 입력창으로 포커스 복귀
  };

  const handleEdit = (id: string) => {
    const record = data.purchaseRecords.find((r) => r.id === id);
    if (!record) return;
    setEditingId(id);
    setAccountId(record.accountId);
    setAmount(String(record.amount));
    setMemo(record.memo ?? '');
    setFocusSignal((n) => n + 1); // 수정 시작 시에도 아이디 입력창에 포커스를 줘서 바로 고칠 수 있게 한다
  };

  const handleCancelEdit = () => {
    resetForm();
    setFocusSignal((n) => n + 1);
  };

  const handleDelete = (id: string) => {
    const record = data.purchaseRecords.find((r) => r.id === id);
    deletePurchaseRecord(id);
    if (record) {
      // 삭제된 기록만큼 현재 수량에서 즉시 차감한다.
      const currentAmountNow = Number(data.purchaseSettings.currentAmount) || 0;
      patchPurchaseSettings({ currentAmount: Math.max(0, currentAmountNow - (Number(record.amount) || 0)) });
    }
    if (editingId === id) resetForm();
    showToast('매입 기록을 삭제했습니다. 현재 수량에 즉시 반영됐습니다.');
  };

  const handleExportSection = () => {
    exportSection('adena', { purchaseSettings: data.purchaseSettings, purchaseRecords: data.purchaseRecords }, '아데나매입');
    showToast('아데나 매입 데이터를 내보냈습니다.', 'success');
  };

  const handleImportSection = async (file: File) => {
    try {
      const json = await readThekFile(file);
      const result = parseSectionFile<{ purchaseSettings?: PurchaseSettings; purchaseRecords?: PurchaseRecord[] }>(json, 'adena');
      if (!result.ok) return showToast(result.error, 'danger');
      importMerge({ purchaseSettings: result.data.purchaseSettings, purchaseRecords: result.data.purchaseRecords });
      showToast('아데나 매입 데이터를 불러와 병합했습니다. (다른 화면 데이터는 그대로입니다)', 'success', 2500);
    } catch {
      showToast('.thek 파일 형식이 올바르지 않습니다.', 'danger');
    }
  };

  const formProps = {
    accountId,
    amount,
    memo,
    onChangeAccountId: setAccountId,
    onChangeAmount: setAmount,
    onChangeMemo: setMemo,
    isEditing: editingId !== null,
    onSubmit: handleSubmit,
    onCancelEdit: handleCancelEdit,
    previewCashAmount: (Number(data.purchaseSettings.rate) || 0) * (Number(amount) || 0),
    focusSignal,
  };

  if (obsOpen) {
    return (
      <ObsLayoutView
        records={data.purchaseRecords}
        settings={data.purchaseSettings}
        editingId={editingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={() => setObsOpen(false)}
        {...formProps}
      />
    );
  }

  return (
    <div id="page-adenaPurchase">
      <PageHeader
        title="아데나 매입"
        subtitle="매입 등록 · 입금 관리 · 방송용 OBS 레이아웃"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFeatureGuideOpen(true)}>
              <HelpCircle size={15} />
              기능 도움말
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setBroadcastGuideOpen(true)}>
              <Radio size={15} />
              방송 도움말
            </Button>
            <Button variant="gold" size="sm" onClick={() => setObsOpen(true)}>
              <Tv size={15} />
              OBS 레이아웃
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
              <Download size={15} />
              내보내기
            </Button>
            <ImportExportButtons label="아데나 매입" onExport={handleExportSection} onImportFile={handleImportSection} />
          </div>
        }
      />

      <PurchaseSummaryBar settings={data.purchaseSettings} onChange={patchPurchaseSettings} />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] p-[3px]">
        <button
          type="button"
          onClick={() => setViewMode('register')}
          className={cn('h-[38px] rounded-full px-5 text-[13px] font-semibold text-text-sub transition-colors', viewMode === 'register' && 'bg-primary text-white')}
        >
          매입 등록
        </button>
        <button
          type="button"
          onClick={() => setViewMode('deposit')}
          className={cn('h-[38px] rounded-full px-5 text-[13px] font-semibold text-text-sub transition-colors', viewMode === 'deposit' && 'bg-primary text-white')}
        >
          입금 / 미입금 관리
        </button>
      </div>

      {viewMode === 'register' ? (
        <>
          <div className="mb-8">
            <PurchaseRecordForm {...formProps} />
          </div>
          <PurchaseRecordTable records={data.purchaseRecords} editingId={editingId} onEdit={handleEdit} onDelete={handleDelete} />
          <PurchaseTotalsBar records={data.purchaseRecords} settings={data.purchaseSettings} />

          <div className="mt-6 rounded-2xl border border-[#1D2530] bg-[#0B1016] p-5">
            <div className="mb-3 text-[14px] font-bold text-white">💡 사용 안내</div>
            <ul className="flex flex-col gap-1.5 text-[12.5px] text-text-sub">
              <li>• 수량 입력은 &apos;만 아데나&apos; 단위입니다.</li>
              <li>• Enter 입력 시 바로 추가됩니다.</li>
              <li>• &apos;입금 완료&apos; 상태는 입금/미입금 관리 탭에서 변경합니다.</li>
              <li>• 비고는 선택 사항입니다.</li>
            </ul>
          </div>
        </>
      ) : (
        <DepositManagementView records={data.purchaseRecords} onToggleDeposit={(id, completed) => updatePurchaseRecord(id, { depositCompleted: completed })} />
      )}

      <ExportPanel open={exportOpen} onClose={() => setExportOpen(false)} records={data.purchaseRecords} settings={data.purchaseSettings} />
      <FeatureGuideDialog open={featureGuideOpen} onClose={() => setFeatureGuideOpen(false)} />
      <BroadcastGuideDialog open={broadcastGuideOpen} onClose={() => setBroadcastGuideOpen(false)} />
    </div>
  );
}

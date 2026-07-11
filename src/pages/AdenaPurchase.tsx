import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { PurchaseSummaryBar } from '@/components/adena/PurchaseSummaryBar';
import { PurchaseRecordForm } from '@/components/adena/PurchaseRecordForm';
import { PurchaseRecordTable } from '@/components/adena/PurchaseRecordTable';
import { DepositStats } from '@/components/adena/DepositStats';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import { generateId } from '@/utils/id';
import type { PurchaseSettings, PurchaseRecord } from '@/types';

/**
 * pages/AdenaPurchase.tsx
 * 아데나 매입 관리 화면. data.purchaseSettings / data.purchaseRecords와 양방향 바인딩되며,
 * 비고(환율×수량)/남은수량/총사용금액까지 전부 계산되어 실시간으로 반영된다.
 */
export function AdenaPurchasePage() {
  const { data } = useAppData();
  const { patchPurchaseSettings, addPurchaseRecord, updatePurchaseRecord, deletePurchaseRecord, importMerge } = useAppDataActions();
  const { showToast } = useToast();

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);

  const resetForm = () => {
    setAccountId('');
    setAmount('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!accountId.trim()) return showToast('아이디를 입력해주세요.', 'danger');
    const amountNumber = Number(amount);
    if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) return showToast('수량을 올바르게 입력해주세요(0보다 큰 숫자).', 'danger');

    // 비고 = 환율(1만당) × 수량(만)
    const cashAmount = data.purchaseSettings.rate * amountNumber;
    const currentAmountNow = Number(data.purchaseSettings.currentAmount) || 0;

    if (editingId) {
      const before = data.purchaseRecords.find((r) => r.id === editingId);
      const beforeAmount = before ? Number(before.amount) || 0 : 0;
      updatePurchaseRecord(editingId, { accountId: accountId.trim(), amount: amountNumber, cashAmount });
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

  return (
    <div id="page-adenaPurchase">
      <PageHeader
        title="아데나 매입"
        subtitle="매입 등록 · 입금 관리"
        actions={<ImportExportButtons label="아데나 매입" onExport={handleExportSection} onImportFile={handleImportSection} />}
      />

      <PurchaseSummaryBar settings={data.purchaseSettings} onChange={patchPurchaseSettings} />

      <div className="mb-10">
        <div className="mb-3.5 text-[13px] font-semibold text-text-sub">매입 등록</div>
        <PurchaseRecordForm
          accountId={accountId}
          amount={amount}
          onChangeAccountId={setAccountId}
          onChangeAmount={setAmount}
          isEditing={editingId !== null}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
          previewCashAmount={(Number(data.purchaseSettings.rate) || 0) * (Number(amount) || 0)}
          focusSignal={focusSignal}
        />
      </div>

      <div className="mb-3">
        <DepositStats records={data.purchaseRecords} />
      </div>
      <PurchaseRecordTable
        records={data.purchaseRecords}
        editingId={editingId}
        onToggleDeposit={(id, completed) => updatePurchaseRecord(id, { depositCompleted: completed })}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

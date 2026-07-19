import { useRef, useState } from 'react';
import { ImageDown, Download, Upload, Settings as SettingsIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { useJpgExport } from '@/hooks/useJpgExport';
import { useEstimateSyncStatus } from '@/hooks/useEstimateDataSync';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_ESTIMATE } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstimateMatrixTable } from '@/components/estimate/EstimateMatrixTable';
import { EstimateSettingsDrawer } from '@/components/estimate/EstimateSettingsDrawer';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import type { EstimatePreset, EstimateMaterial, AppData } from '@/types';

export function EstimatePage() {
  const { data } = useAppData();
  const { patchEstimate, addPreset, updatePreset, deletePreset, importMerge, resetEstimateToBase } = useAppDataActions();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { exportPage } = useJpgExport();
  const { status: estimateSyncStatus, retry: retryEstimateSync, errorMessage: estimateSyncError } = useEstimateSyncStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const estimate = data.estimate;

  const handleMaterialsChange = (materials: EstimateMaterial[]) => patchEstimate({ materials });
  const handleResetMaterials = async () => {
    if (await confirm('현재 재료 구성을 기본 프리셋("달의 장궁")으로 초기화합니다.')) {
      resetEstimateToBase();
      showToast('기본 구성으로 초기화했습니다.', 'success');
    }
  };
  const handleRateChange = (group: 'A' | 'B', value: number) => patchEstimate(group === 'A' ? { rateA: value } : { rateB: value });
  const handleKeyPriceChange = (group: 'A' | 'B', value: number) => {
    const keyMaterial = estimate.materials[0];
    if (!keyMaterial) return;
    const key = group === 'A' ? 'priceA' : 'priceB';
    patchEstimate({ materials: estimate.materials.map((m) => (m.id === keyMaterial.id ? { ...m, [key]: value } : m)) });
  };
  const handleKeyMaterialSelect = (materialId: string) => {
    const target = estimate.materials.find((m) => m.id === materialId);
    if (!target) return;
    patchEstimate({ materials: [target, ...estimate.materials.filter((m) => m.id !== materialId)] });
  };

  const handleApplyPreset = (preset: EstimatePreset) => {
    patchEstimate({
      materials: JSON.parse(JSON.stringify(preset.materials)),
      rateA: preset.rateA,
      rateB: preset.rateB,
      feeA: preset.feeA,
      feeB: preset.feeB,
    });
    showToast(`프리셋 "${preset.name}"을(를) 적용했습니다.`, 'success');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(estimate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-k-estimate-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('견적 JSON을 저장했습니다.', 'success');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const incoming = JSON.parse(e.target?.result as string);
        if (Array.isArray(incoming.materials)) {
          patchEstimate({
            materials: incoming.materials,
            rateA: incoming.rateA || 0,
            rateB: incoming.rateB || 0,
            feeA: incoming.feeA || 0,
            feeB: incoming.feeB || 0,
          });
        }
        showToast('견적 JSON을 가져왔습니다.', 'success');
      } catch {
        showToast('JSON 파일을 읽을 수 없습니다.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  const handleExportSection = () => {
    exportSection('estimate', { estimatePresets: data.estimate.presets }, '제작계산기');
    showToast('제작 계산기 프리셋을 내보냈습니다.', 'success');
  };

  const handleImportSection = async (file: File) => {
    try {
      const json = await readThekFile(file);
      const result = parseSectionFile<{ estimatePresets?: EstimatePreset[] }>(json, 'estimate');
      if (!result.ok) return showToast(result.error, 'danger');
      importMerge({ estimate: { presets: result.data.estimatePresets ?? [] } as AppData['estimate'] });
      showToast('제작 계산기 프리셋을 불러와 병합했습니다. (다른 화면 데이터는 그대로입니다)', 'success', 2500);
    } catch {
      showToast('.thek 파일 형식이 올바르지 않습니다.', 'danger');
    }
  };

  return (
    <div id="page-estimate">
      <PageHeader
        title="제작 비교 견적"
        subtitle="재료 가격과 환율을 동시에 비교합니다."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="gold" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon size={16} />
              비교 설정
            </Button>
            <ImportExportButtons label="제작 계산기" onExport={handleExportSection} onImportFile={handleImportSection} />
            <HelpButton content={HELP_ESTIMATE} />
          </div>
        }
      />

      {estimateSyncStatus === 'error' && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-dim p-5 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/20 text-danger">
              <AlertTriangle size={18} />
            </span>
            <div>
              <div className="text-[14px] font-bold text-danger">최신 견적 데이터를 불러오지 못했습니다</div>
              <div className="mt-1 text-[12.5px] text-text-sub">
                estimate-data.json을 읽는 데 실패해 화면에 표시된 재료·가격·환율이 정확하지 않을 수 있습니다. 아래 값을 그대로 신뢰하지 마세요.
                {estimateSyncError && <span className="mt-1 block text-[11px] text-text-faint">({estimateSyncError})</span>}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={retryEstimateSync} className="shrink-0">
            <RefreshCw size={14} />
            다시 시도
          </Button>
        </div>
      )}

      <EstimateSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        estimate={estimate}
        onRateChange={handleRateChange}
        onKeyPriceChange={handleKeyPriceChange}
        onKeyMaterialSelect={handleKeyMaterialSelect}
        onMaterialsChange={handleMaterialsChange}
        onResetMaterials={handleResetMaterials}
        onQtyChange={(tier) => patchEstimate({ qtyTier: tier })}
        onAddPreset={addPreset}
        onUpdatePreset={updatePreset}
        onDeletePreset={deletePreset}
        onApplyPreset={handleApplyPreset}
      />

      <div className="mb-10">
        <EstimateMatrixTable materials={estimate.materials} rateA={estimate.rateA} rateB={estimate.rateB} feeA={estimate.feeA} feeB={estimate.feeB} />
      </div>

      <Section title="내보내기">
        <Card className="flex flex-wrap gap-2.5 rounded-2xl border-[#1D2530] bg-[#0B1016]">
          <Button variant="warning" onClick={() => exportPage('estimate')}>
            <ImageDown size={18} />
            현재 견적 JPG 저장
          </Button>
          <Button variant="success" onClick={handleExportJson}>
            <Download size={18} />
            현재 견적 JSON 저장
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            JSON 가져오기
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportJson(file);
              e.target.value = '';
            }}
          />
        </Card>
      </Section>
    </div>
  );
}

import { useRef } from 'react';
import { ImageDown, Download, Upload } from 'lucide-react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { useJpgExport } from '@/hooks/useJpgExport';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceCards } from '@/components/estimate/PriceCards';
import { QtySelectCards } from '@/components/estimate/QtySelectCards';
import { EstimateHero } from '@/components/estimate/EstimateHero';
import { EstimateResultTable } from '@/components/estimate/EstimateResultTable';
import { EstimateDetailPanel } from '@/components/estimate/EstimateDetailPanel';
import { MaterialEditor } from '@/components/estimate/MaterialEditor';
import { PresetGrid } from '@/components/estimate/PresetGrid';
import { CollapsiblePanel } from '@/components/common/CollapsiblePanel';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import { calcEstimateGroup } from '@/lib/calculations';
import type { EstimateMaterial, EstimatePreset, AppData } from '@/types';

export function EstimatePage() {
  const { data } = useAppData();
  const { patchEstimate, resetEstimateToBase, addPreset, updatePreset, deletePreset, importMerge } = useAppDataActions();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { exportPage } = useJpgExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estimate = data.estimate;
  const resA = calcEstimateGroup(estimate.materials, 'priceA', estimate.rateA, estimate.feeA, estimate.qtyTier);
  const resB = calcEstimateGroup(estimate.materials, 'priceB', estimate.rateB, estimate.feeB, estimate.qtyTier);

  const handlePriceChange = (group: 'A' | 'B', materialId: string, value: number) => {
    const key = group === 'A' ? 'priceA' : 'priceB';
    patchEstimate({ materials: estimate.materials.map((m) => (m.id === materialId ? { ...m, [key]: value } : m)) });
  };
  const handleRateChange = (group: 'A' | 'B', value: number) => patchEstimate(group === 'A' ? { rateA: value } : { rateB: value });
  const handleFeeChange = (group: 'A' | 'B', value: number) => patchEstimate(group === 'A' ? { feeA: value } : { feeB: value });

  const handleMaterialsChange = (materials: EstimateMaterial[]) => patchEstimate({ materials });

  const handleResetMaterials = async () => {
    if (await confirm('현재 재료 구성을 기본 프리셋("달의 장궁")으로 초기화합니다.')) {
      resetEstimateToBase();
      showToast('기본 구성으로 초기화했습니다.', 'success');
    }
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
        actions={<ImportExportButtons label="제작 계산기" onExport={handleExportSection} onImportFile={handleImportSection} />}
      />

      <div className="mb-8">
        <EstimateHero materials={estimate.materials} rateA={estimate.rateA} rateB={estimate.rateB} />
      </div>

      <div className="mb-5">
        <EstimateResultTable materials={estimate.materials} rateA={estimate.rateA} rateB={estimate.rateB} feeA={estimate.feeA} feeB={estimate.feeB} />
      </div>

      <div className="mb-10">
        <EstimateDetailPanel materials={estimate.materials} resA={resA} resB={resB} />
      </div>

      <CollapsiblePanel label="설정">
        <div>
          <div className="mb-3.5 flex items-center gap-2 text-[15px] font-bold">비교 설정</div>
          <PriceCards
            materials={estimate.materials}
            rateA={estimate.rateA}
            rateB={estimate.rateB}
            feeA={estimate.feeA}
            feeB={estimate.feeB}
            onPriceChange={handlePriceChange}
            onRateChange={handleRateChange}
            onFeeChange={handleFeeChange}
          />
        </div>

        <div>
          <div className="mb-3.5 flex items-center gap-2 text-[15px] font-bold">수량 선택</div>
          <QtySelectCards value={estimate.qtyTier} onChange={(tier) => patchEstimate({ qtyTier: tier })} />
        </div>

        <div>
          <div className="mb-3.5 flex items-center gap-2 text-[15px] font-bold">재료 변경</div>
          <MaterialEditor
            materials={estimate.materials}
            onChange={handleMaterialsChange}
            onReset={handleResetMaterials}
            onApplyToast={() => showToast('재료 구성을 적용했습니다.', 'success')}
          />
        </div>
      </CollapsiblePanel>

      <Section title="사용자 정의 프리셋">
        <PresetGrid
          presets={estimate.presets}
          currentEstimate={estimate}
          onAdd={addPreset}
          onUpdate={updatePreset}
          onDelete={deletePreset}
          onApply={handleApplyPreset}
        />
      </Section>

      <Section title="내보내기">
        <Card className="flex flex-wrap gap-2.5 rounded-[20px] border-[#2A2D35] bg-[#1B1D22]">
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

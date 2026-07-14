import { useRef } from 'react';
import { ImageDown, Download, Upload, Settings as SettingsIcon } from 'lucide-react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useJpgExport } from '@/hooks/useJpgExport';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstimateMatrixTable } from '@/components/estimate/EstimateMatrixTable';
import { PresetGrid } from '@/components/estimate/PresetGrid';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import type { EstimatePreset, AppData } from '@/types';

export function EstimatePage() {
  const { data } = useAppData();
  const { patchEstimate, addPreset, updatePreset, deletePreset, importMerge } = useAppDataActions();
  const { showToast } = useToast();
  const { exportPage } = useJpgExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estimate = data.estimate;

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

      <div className="mb-3 flex items-center justify-end">
        <a href="#settings" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-faint transition-colors hover:text-primary">
          <SettingsIcon size={13} />
          비교 조건 · 재료 · 수량은 설정에서 관리
        </a>
      </div>

      <div className="mb-10">
        <EstimateMatrixTable materials={estimate.materials} rateA={estimate.rateA} rateB={estimate.rateB} feeA={estimate.feeA} feeB={estimate.feeB} />
      </div>

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

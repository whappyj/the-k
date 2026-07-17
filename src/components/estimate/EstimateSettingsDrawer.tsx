import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { EstimateConditionSettings } from '@/components/settings/EstimateConditionSettings';
import { MaterialEditor } from '@/components/estimate/MaterialEditor';
import { QtySelectCards } from '@/components/estimate/QtySelectCards';
import { PresetGrid } from '@/components/estimate/PresetGrid';
import type { EstimateState, EstimateMaterial, EstimatePreset } from '@/types';

interface EstimateSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  estimate: EstimateState;
  onRateChange: (group: 'A' | 'B', value: number) => void;
  onKeyPriceChange: (group: 'A' | 'B', value: number) => void;
  onKeyMaterialSelect: (materialId: string) => void;
  onMaterialsChange: (materials: EstimateMaterial[]) => void;
  onResetMaterials: () => void;
  onQtyChange: (tier: EstimateState['qtyTier']) => void;
  onAddPreset: (preset: EstimatePreset) => void;
  onUpdatePreset: (id: string, patch: Partial<EstimatePreset>) => void;
  onDeletePreset: (id: string) => void;
  onApplyPreset: (preset: EstimatePreset) => void;
}

/**
 * components/estimate/EstimateSettingsDrawer.tsx
 * "제작 비교 견적" 화면 우측 상단 "⚙ 비교설정" 버튼으로 여는 슬라이드 패널.
 * 기존에 설정 화면에 있던 환율/시세/재료/수량/프리셋 편집 기능을 그대로 이 안으로
 * 옮겨왔을 뿐 — 계산 로직·데이터 구조는 전부 기존 컴포넌트(EstimateConditionSettings 등)를
 * 그대로 재사용한다.
 */
export function EstimateSettingsDrawer({
  open,
  onClose,
  estimate,
  onRateChange,
  onKeyPriceChange,
  onKeyMaterialSelect,
  onMaterialsChange,
  onResetMaterials,
  onQtyChange,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onApplyPreset,
}: EstimateSettingsDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="⚙ 비교 설정" footer={<Button variant="gold" onClick={onClose}>적용</Button>}>
      <div className="flex flex-col gap-8">
        <section>
          <div className="mb-3 text-[13px] font-bold text-text-sub">환율 · 아이템 시세</div>
          <EstimateConditionSettings
            materials={estimate.materials}
            rateA={estimate.rateA}
            rateB={estimate.rateB}
            onRateChange={onRateChange}
            onKeyPriceChange={onKeyPriceChange}
            onKeyMaterialSelect={onKeyMaterialSelect}
          />
        </section>

        <section>
          <div className="mb-3 text-[13px] font-bold text-text-sub">제작 수량</div>
          <QtySelectCards value={estimate.qtyTier} onChange={onQtyChange} />
        </section>

        <section>
          <div className="mb-3 text-[13px] font-bold text-text-sub">프리셋</div>
          <PresetGrid presets={estimate.presets} currentEstimate={estimate} onAdd={onAddPreset} onUpdate={onUpdatePreset} onDelete={onDeletePreset} onApply={onApplyPreset} />
        </section>

        <section>
          <details className="group">
            <summary className="mb-3 cursor-pointer list-none text-[13px] font-bold text-text-sub">
              <span className="inline-flex items-center gap-1.5">
                <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
                재료 가격 (펼치기)
              </span>
            </summary>
            <MaterialEditor materials={estimate.materials} onChange={onMaterialsChange} onReset={onResetMaterials} onApplyToast={() => {}} />
          </details>
        </section>
      </div>
    </Drawer>
  );
}

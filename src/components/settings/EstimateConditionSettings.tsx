import type { EstimateMaterial } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface EstimateConditionSettingsProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  onRateChange: (group: 'A' | 'B', value: number) => void;
  onKeyPriceChange: (group: 'A' | 'B', value: number) => void;
  onKeyMaterialSelect: (materialId: string) => void;
}

/**
 * components/settings/EstimateConditionSettings.tsx
 * 설정 > 비교 기준(A/B) 탭. 아데나 시세 박스(A/B 환율)와 핵심재료 박스(선택 드롭다운 + A/B 가격)
 * 두 카드로 구성한다. 핵심재료는 재료 목록에서 ★로 지정한(=배열 맨 앞) 재료이며, 드롭다운으로도
 * 같은 방식(배열 재정렬)으로 바꿀 수 있다. patchEstimate만 그대로 재사용하므로 계산식/저장 방식은
 * 바뀌지 않는다. 입력 즉시 제작 비교 견적 화면에 반영된다.
 */
export function EstimateConditionSettings({
  materials,
  rateA,
  rateB,
  onRateChange,
  onKeyPriceChange,
  onKeyMaterialSelect,
}: EstimateConditionSettingsProps) {
  const keyMaterial = materials[0] ?? null;

  return (
    <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
      <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
        <div className="mb-4 text-[13px] font-semibold text-[#9AA1AC]">아데나 시세 (1만 아데나 기준)</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-primary">A 조건</Label>
            <div className="flex items-center gap-1.5">
              <Input type="number" min={0} value={rateA || ''} placeholder="900" onChange={(e) => onRateChange('A', Number(e.target.value) || 0)} className="rounded-xl border-[#1D2530] bg-white/[0.04]" />
              <span className="text-[13px] text-[#9AA1AC]">원</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-warning">B 조건</Label>
            <div className="flex items-center gap-1.5">
              <Input type="number" min={0} value={rateB || ''} placeholder="1000" onChange={(e) => onRateChange('B', Number(e.target.value) || 0)} className="rounded-xl border-[#1D2530] bg-white/[0.04]" />
              <span className="text-[13px] text-[#9AA1AC]">원</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
        <div className="mb-4 text-[13px] font-semibold text-[#9AA1AC]">핵심 재료 (비교 기준이 되는 재료)</div>
        <Select
          value={keyMaterial?.id ?? ''}
          onChange={(e) => onKeyMaterialSelect(e.target.value)}
          className="mb-4 rounded-xl border-[#1D2530] bg-white/[0.04]"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              ★ {m.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-primary">A 가격</Label>
            <Input
              type="number"
              min={0}
              disabled={!keyMaterial}
              value={keyMaterial?.priceA || ''}
              placeholder="0"
              onChange={(e) => onKeyPriceChange('A', Number(e.target.value) || 0)}
              className="rounded-xl border-[#1D2530] bg-white/[0.04]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-warning">B 가격</Label>
            <Input
              type="number"
              min={0}
              disabled={!keyMaterial}
              value={keyMaterial?.priceB || ''}
              placeholder="0"
              onChange={(e) => onKeyPriceChange('B', Number(e.target.value) || 0)}
              className="rounded-xl border-[#1D2530] bg-white/[0.04]"
            />
          </div>
        </div>
      </div>

      <div className="col-span-2 text-[11px] text-[#9AA1AC] max-[640px]:col-span-1">
        ※ 핵심 재료는 비교에서 가장 큰 영향을 주는 재료입니다. (재료 목록에서 ★로 지정한 재료가 자동으로 선택됩니다.)
      </div>
    </div>
  );
}

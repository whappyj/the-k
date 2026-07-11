import type { EstimateMaterial } from '@/types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EstimateConditionSettingsProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  onRateChange: (group: 'A' | 'B', value: number) => void;
  onKeyPriceChange: (group: 'A' | 'B', value: number) => void;
}

/**
 * components/settings/EstimateConditionSettings.tsx
 * 설정 > 비교 조건 탭. A 환율 / B 환율 / A 핵심재료 가격 / B 핵심재료 가격, 이 네 가지만 관리한다.
 * 핵심재료는 재료 목록 탭에서 ★로 지정한(=배열 맨 앞) 재료다. 기존 patchEstimate만 그대로
 * 재사용하므로 계산식/저장 방식은 바뀌지 않는다. 입력 즉시 제작 비교 견적 화면에 반영된다.
 */
export function EstimateConditionSettings({ materials, rateA, rateB, onRateChange, onKeyPriceChange }: EstimateConditionSettingsProps) {
  const keyMaterial = materials[0] ?? null;

  return (
    <Card className="rounded-2xl border-[#2A2F38] bg-[#171A20]">
      {!keyMaterial && (
        <div className="mb-4 rounded-xl border border-dashed border-[#2A2F38] px-4 py-3 text-[13px] text-[#8A93A3]">
          아직 핵심재료가 없습니다. "재료 목록" 탭에서 재료를 추가하고 ★를 눌러 핵심재료로 지정해주세요.
        </div>
      )}
      <div className="grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-primary">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary-dim text-[11px] font-bold">A</span>
            조건 A
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8A93A3]">A 환율 (1만 아데나당)</Label>
            <Input type="number" min={0} value={rateA || ''} placeholder="예: 900" onChange={(e) => onRateChange('A', Number(e.target.value) || 0)} className="rounded-xl border-[#2A2F38] bg-white/[0.04]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8A93A3]">A 핵심재료 가격{keyMaterial ? ` (${keyMaterial.name})` : ''}</Label>
            <Input
              type="number"
              min={0}
              disabled={!keyMaterial}
              value={keyMaterial?.priceA || ''}
              placeholder="0"
              onChange={(e) => onKeyPriceChange('A', Number(e.target.value) || 0)}
              className="rounded-xl border-[#2A2F38] bg-white/[0.04]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-warning">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-warning-dim text-[11px] font-bold">B</span>
            조건 B
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8A93A3]">B 환율 (1만 아데나당)</Label>
            <Input type="number" min={0} value={rateB || ''} placeholder="예: 1000" onChange={(e) => onRateChange('B', Number(e.target.value) || 0)} className="rounded-xl border-[#2A2F38] bg-white/[0.04]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8A93A3]">B 핵심재료 가격{keyMaterial ? ` (${keyMaterial.name})` : ''}</Label>
            <Input
              type="number"
              min={0}
              disabled={!keyMaterial}
              value={keyMaterial?.priceB || ''}
              placeholder="0"
              onChange={(e) => onKeyPriceChange('B', Number(e.target.value) || 0)}
              className="rounded-xl border-[#2A2F38] bg-white/[0.04]"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

import type { EstimateMaterial } from '@/types';
import { Card, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface GroupProps {
  group: 'A' | 'B';
  materials: EstimateMaterial[];
  rate: number;
  fee: number;
  onMaterialPriceChange: (materialId: string, value: number) => void;
  onRateChange: (value: number) => void;
  onFeeChange: (value: number) => void;
}

const GROUP_ACCENT: Record<'A' | 'B', string> = { A: 'border-t-primary', B: 'border-t-warning' };
const GROUP_BADGE: Record<'A' | 'B', string> = { A: 'bg-primary-dim text-primary', B: 'bg-warning-dim text-warning' };

function GroupCard({ group, materials, rate, fee, onMaterialPriceChange, onRateChange, onFeeChange }: GroupProps) {
  const priceKey = group === 'A' ? 'priceA' : 'priceB';

  return (
    <Card className={`rounded-[20px] border-[#2A2D35] bg-[#1B1D22] border-t-[3px] ${GROUP_ACCENT[group]}`}>
      <CardTitle className="text-white">
        <span className={`mr-2 inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg font-display text-[13px] font-bold ${GROUP_BADGE[group]}`}>
          {group}
        </span>
        비교 {group}
      </CardTitle>

      <div className="mb-2 flex flex-col gap-3.5">
        {materials.map((m) => (
          <div key={m.id} className="flex items-center gap-4">
            <Label className="flex-1 text-[#8A8F9C]">{m.name} 가격</Label>
            <Input
              type="number"
              min={0}
              className="h-10 w-[160px] shrink-0 rounded-xl border-[#2A2D35] bg-white/[0.04]"
              value={m[priceKey] || ''}
              placeholder="0"
              onChange={(e) => onMaterialPriceChange(m.id, Number(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-[#2A2D35]" />

      <div className="mb-4 flex flex-col gap-1.5">
        <Label className="text-[#8A8F9C]">아데나 환율</Label>
        <Input
          type="number"
          min={0}
          value={rate || ''}
          placeholder={group === 'A' ? '예: 900' : '예: 1000'}
          onChange={(e) => onRateChange(Number(e.target.value) || 0)}
          className="rounded-xl border-[#2A2D35] bg-white/[0.04]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[#8A8F9C]">제작비 (아데나, 선택)</Label>
        <Input
          type="number"
          min={0}
          value={fee || ''}
          placeholder="0"
          onChange={(e) => onFeeChange(Number(e.target.value) || 0)}
          className="rounded-xl border-[#2A2D35] bg-white/[0.04]"
        />
      </div>
    </Card>
  );
}

interface PriceCardsProps {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  onPriceChange: (group: 'A' | 'B', materialId: string, value: number) => void;
  onRateChange: (group: 'A' | 'B', value: number) => void;
  onFeeChange: (group: 'A' | 'B', value: number) => void;
}

export function PriceCards({ materials, rateA, rateB, feeA, feeB, onPriceChange, onRateChange, onFeeChange }: PriceCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
      <GroupCard
        group="A"
        materials={materials}
        rate={rateA}
        fee={feeA}
        onMaterialPriceChange={(id, v) => onPriceChange('A', id, v)}
        onRateChange={(v) => onRateChange('A', v)}
        onFeeChange={(v) => onFeeChange('A', v)}
      />
      <GroupCard
        group="B"
        materials={materials}
        rate={rateB}
        fee={feeB}
        onMaterialPriceChange={(id, v) => onPriceChange('B', id, v)}
        onRateChange={(v) => onRateChange('B', v)}
        onFeeChange={(v) => onFeeChange('B', v)}
      />
    </div>
  );
}

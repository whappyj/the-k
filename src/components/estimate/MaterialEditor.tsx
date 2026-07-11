import { Plus, Check, RotateCcw, Trash2 } from 'lucide-react';
import type { EstimateMaterial } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/utils/id';

interface MaterialEditorProps {
  materials: EstimateMaterial[];
  onChange: (materials: EstimateMaterial[]) => void;
  onReset: () => void;
  onApplyToast: () => void;
}

export function MaterialEditor({ materials, onChange, onReset, onApplyToast }: MaterialEditorProps) {
  const updateRow = (id: string, patch: Partial<EstimateMaterial>) => {
    onChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addRow = () => {
    onChange([...materials, { id: generateId(), name: '', qty: 0, priceA: 0, priceB: 0 }]);
  };

  const deleteRow = (id: string) => {
    onChange(materials.filter((m) => m.id !== id));
  };

  return (
    <Card className="overflow-x-auto rounded-[20px] border-[#2A2D35] bg-[#1B1D22]">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            {['재료명', '필요수량', 'A 가격', 'B 가격', ''].map((h, i) => (
              <th key={h || 'action'} className={`px-2.5 py-2.5 text-left text-xs font-semibold text-[#8A8F9C] ${i > 0 && i < 4 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-t border-[#2A2D35] first:border-t-0">
              <td className="px-2.5 py-2">
                <Input value={m.name} placeholder="재료명" className="h-10 rounded-xl border-[#2A2D35] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { name: e.target.value })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.qty} placeholder="0" className="ml-auto h-10 max-w-[130px] rounded-xl border-[#2A2D35] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { qty: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.priceA} placeholder="0" className="ml-auto h-10 max-w-[130px] rounded-xl border-[#2A2D35] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { priceA: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.priceB} placeholder="0" className="ml-auto h-10 max-w-[130px] rounded-xl border-[#2A2D35] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { priceB: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Button variant="ghost" size="icon" aria-label="재료 삭제" onClick={() => deleteRow(m.id)} className="text-danger hover:bg-danger-dim">
                  <Trash2 size={20} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button variant="secondary" size="sm" onClick={addRow}>
          <Plus size={18} />
          재료 추가
        </Button>
        <Button variant="success" size="sm" onClick={onApplyToast}>
          <Check size={18} />
          적용
        </Button>
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw size={18} />
          초기화
        </Button>
      </div>
    </Card>
  );
}

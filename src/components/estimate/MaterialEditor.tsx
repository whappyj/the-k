import { Plus, Check, RotateCcw, Trash2, Star } from 'lucide-react';
import type { EstimateMaterial } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/utils/id';
import { cn } from '@/utils/cn';
import { getMaterialIcon } from '@/utils/materialIcon';

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

  /** ★ 핵심재료로 지정 — 목록 맨 앞으로 이동시킨다. 새 필드를 추가하지 않고
   *  기존 재료 배열의 "순서"만 바꾸므로 JSON 구조/저장 형식은 전혀 달라지지 않는다.
   *  (조건/결과 화면의 "핵심재료"는 항상 이 배열의 첫 번째 항목을 사용한다.) */
  const setKeyMaterial = (id: string) => {
    const target = materials.find((m) => m.id === id);
    if (!target) return;
    onChange([target, ...materials.filter((m) => m.id !== id)]);
  };

  return (
    <Card className="overflow-x-auto rounded-2xl border-[#2A2F38] bg-[#171A20]">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr>
            {['', '', '재료명', '1개 제작 필요수량', 'A 가격', 'B 가격', '작업'].map((h, i) => (
              <th key={h || `action-${i}`} className={`px-2.5 py-2.5 text-left text-xs font-semibold text-[#8A93A3] ${i > 2 && i < 6 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m, i) => {
            const Icon = getMaterialIcon(m.name);
            return (
            <tr key={m.id} className="border-t border-[#2A2F38] transition-colors duration-150 first:border-t-0 hover:bg-white/[0.02]">
              <td className="px-2 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={i === 0 ? '핵심재료' : '핵심재료로 지정'}
                  onClick={() => setKeyMaterial(m.id)}
                  className={cn(i === 0 ? 'text-gold' : 'text-[#8A93A3]')}
                >
                  <Star size={18} fill={i === 0 ? 'currentColor' : 'none'} />
                </Button>
              </td>
              <td className="px-1 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-[#8A93A3]">
                  <Icon size={16} />
                </span>
              </td>
              <td className="px-2.5 py-2">
                <Input value={m.name} placeholder="재료명" className="h-11 rounded-xl border-[#2A2F38] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { name: e.target.value })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.qty} placeholder="0" className="ml-auto h-11 max-w-[130px] rounded-xl border-[#2A2F38] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { qty: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.priceA} placeholder="0" className="ml-auto h-11 max-w-[130px] rounded-xl border-[#2A2F38] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { priceA: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Input type="number" min={0} value={m.priceB} placeholder="0" className="ml-auto h-11 max-w-[130px] rounded-xl border-[#2A2F38] bg-white/[0.04]" onChange={(e) => updateRow(m.id, { priceB: Number(e.target.value) || 0 })} />
              </td>
              <td className="px-2.5 py-2">
                <Button variant="ghost" size="icon" aria-label="재료 삭제" onClick={() => deleteRow(m.id)} className="text-danger hover:bg-danger-dim">
                  <Trash2 size={20} />
                </Button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-2.5 pt-2 text-[11px] text-[#8A93A3]">★를 누르면 그 재료가 "핵심재료"가 되어 조건/결과 화면 맨 위에 표시됩니다.</div>

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

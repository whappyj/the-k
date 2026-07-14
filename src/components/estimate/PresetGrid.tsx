import { Star, Copy, Pencil, Trash2, Plus } from 'lucide-react';
import type { EstimatePreset, EstimateState } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { generateId } from '@/utils/id';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

interface PresetGridProps {
  presets: EstimatePreset[];
  currentEstimate: Pick<EstimateState, 'materials' | 'rateA' | 'rateB' | 'feeA' | 'feeB'>;
  onAdd: (preset: EstimatePreset) => void;
  onUpdate: (id: string, patch: Partial<EstimatePreset>) => void;
  onDelete: (id: string) => void;
  onApply: (preset: EstimatePreset) => void;
}

export function PresetGrid({ presets, currentEstimate, onAdd, onUpdate, onDelete, onApply }: PresetGridProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const sorted = [...presets].sort((a, b) => {
    if (a.readonly !== b.readonly) return a.readonly ? -1 : 1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name, 'ko');
  });

  const handleCreate = () => {
    const rawName = window.prompt('새 프리셋 이름을 입력하세요.');
    const name = rawName?.trim();
    if (!name) return;
    onAdd({
      id: generateId(),
      name,
      readonly: false,
      favorite: false,
      materials: JSON.parse(JSON.stringify(currentEstimate.materials)),
      rateA: currentEstimate.rateA,
      rateB: currentEstimate.rateB,
      feeA: currentEstimate.feeA,
      feeB: currentEstimate.feeB,
      createdAt: new Date().toISOString(),
    });
    showToast(`프리셋 "${name}"을(를) 저장했습니다.`, 'success');
  };

  const handleRename = (preset: EstimatePreset) => {
    const rawName = window.prompt('새 이름을 입력하세요.', preset.name);
    const name = rawName?.trim();
    if (!name) return;
    onUpdate(preset.id, { name });
  };

  const handleDuplicate = (preset: EstimatePreset) => {
    onAdd({
      ...preset,
      id: generateId(),
      name: `${preset.name} 복사본`,
      readonly: false,
      favorite: false,
      materials: JSON.parse(JSON.stringify(preset.materials)),
      createdAt: new Date().toISOString(),
    });
    showToast('프리셋을 복사했습니다.', 'success');
  };

  const handleDelete = async (preset: EstimatePreset) => {
    if (await confirm(`프리셋 "${preset.name}"을(를) 삭제하시겠습니까?`)) {
      onDelete(preset.id);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {sorted.map((p) => (
          <Card key={p.id} className={cn('flex flex-col gap-3 rounded-2xl border-[#1D2530] bg-[#0B1016] p-5', p.readonly && 'border-dashed')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-[11px] text-[#9AA1AC]">{p.readonly ? '기본 프리셋 · 읽기전용' : '사용자 프리셋'}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="즐겨찾기"
                onClick={() => onUpdate(p.id, { favorite: !p.favorite })}
                className={cn(p.favorite ? 'text-warning' : 'text-[#9AA1AC]')}
              >
                <Star size={16} fill={p.favorite ? 'currentColor' : 'none'} />
              </Button>
            </div>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => onApply(p)}>
                불러오기
              </Button>
              <Button variant="ghost" size="icon" aria-label="복사" onClick={() => handleDuplicate(p)}>
                <Copy size={18} />
              </Button>
              {!p.readonly && (
                <>
                  <Button variant="ghost" size="icon" aria-label="이름 수정" onClick={() => handleRename(p)}>
                    <Pencil size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="삭제" onClick={() => handleDelete(p)} className="text-danger">
                    <Trash2 size={18} />
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-4" onClick={handleCreate}>
        <Plus size={18} />
        새 프리셋 생성
      </Button>
    </div>
  );
}

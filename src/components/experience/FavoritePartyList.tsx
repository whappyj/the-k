import { Star, RefreshCw, Trash2 } from 'lucide-react';
import type { FavoriteParty } from '@/types';
import { Button } from '@/components/ui/button';
import { EmptyCell } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { generateId } from '@/utils/id';

interface CurrentParty {
  knight: number;
  elf: number;
  wizard: number;
  bibigiEnabled: boolean;
  bibigiCount: number;
  molly: boolean;
}

interface FavoritePartyListProps {
  favorites: FavoriteParty[];
  current: CurrentParty;
  onAdd: (fav: FavoriteParty) => void;
  onUpdate: (id: string, patch: Partial<FavoriteParty>) => void;
  onDelete: (id: string) => void;
  onLoad: (fav: FavoriteParty) => void;
}

export function FavoritePartyList({ favorites, current, onAdd, onUpdate, onDelete, onLoad }: FavoritePartyListProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const handleSave = () => {
    const rawName = window.prompt('즐겨찾기 이름을 입력하세요. (예: 풀파티)');
    const name = rawName?.trim();
    if (!name) return;
    onAdd({ id: generateId(), name, ...current, createdAt: new Date().toISOString() });
    showToast(`즐겨찾기 "${name}"을(를) 저장했습니다.`, 'success');
  };

  const handleDelete = async (fav: FavoriteParty) => {
    if (await confirm('이 즐겨찾기를 삭제하시겠습니까?')) onDelete(fav.id);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2">
        {favorites.length === 0 && <EmptyCell>저장된 즐겨찾기가 없습니다.</EmptyCell>}
        {favorites.map((fav) => (
          <div key={fav.id} className="flex items-center justify-between gap-2.5 rounded-xl border border-border/[0.08] bg-white/[0.03] px-3 py-2.5">
            <button type="button" className="flex-1 text-left" onClick={() => onLoad(fav)}>
              <div className="text-[13px] font-semibold">{fav.name}</div>
              <div className="mt-0.5 text-[11px] text-text-sub">
                기{fav.knight}/요{fav.elf}/법{fav.wizard}
                {fav.bibigiEnabled ? ` · 비비기${fav.bibigiCount}` : ''}
                {fav.molly ? ' · 몰이' : ''}
              </div>
            </button>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" aria-label="현재 값으로 수정" onClick={() => onUpdate(fav.id, current)}>
                <RefreshCw size={18} />
              </Button>
              <Button variant="ghost" size="icon" aria-label="삭제" onClick={() => handleDelete(fav)} className="text-danger">
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" onClick={handleSave}>
        <Star size={18} />
        현재 구성 저장
      </Button>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Search, Pencil, Copy, Trash2, Download } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { useConfirm } from '@/hooks/useConfirm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InteractiveCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyCell } from '@/components/common/EmptyState';
import { exportExperienceRecordsCsv } from '@/lib/experienceExport';

interface RecordListProps {
  records: ExperienceRecord[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecordList({ records, onEdit, onDuplicate, onDelete }: RecordListProps) {
  const { formatPercent, formatDuration } = useFormatters();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');

  const hasActiveFilter = Boolean(search);

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (search) {
          const hay = `${r.huntArea} ${r.memo} ${r.startDate}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime());
  }, [records, search]);

  const list = hasActiveFilter ? filtered : filtered.slice(0, 10);

  const handleDelete = async (id: string) => {
    if (await confirm('이 기록을 삭제하시겠습니까?')) onDelete(id);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <Input className="pl-10" placeholder="사냥터, 메모, 날짜로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="secondary" size="sm" onClick={() => exportExperienceRecordsCsv(hasActiveFilter ? filtered : records)} disabled={!records.length}>
          <Download size={16} />
          CSV{hasActiveFilter ? ` (${filtered.length}건)` : ''}
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyCell>{hasActiveFilter ? '검색 결과가 없습니다.' : '저장된 경험치 기록이 없습니다.'}</EmptyCell>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[1400px]:grid-cols-2 max-[900px]:grid-cols-1">
          {list.map((r) => (
            <InteractiveCard key={r.id} onClick={() => onEdit(r.id)} className="flex cursor-pointer flex-col gap-2.5 hover:scale-100 hover:border-primary/35 hover:shadow-soft">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="text-[15px] font-bold">{r.huntArea}</div>
                  <div className="mt-0.5 text-xs text-text-sub">
                    {r.startLevel === r.endLevel ? `Lv${r.endLevel}` : `Lv${r.startLevel}→${r.endLevel}`} · {r.startDate} {r.startTime} · {formatDuration(r.playTime)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold">{formatPercent(r.expPerHour)}/h</div>
                  <div className="text-success">+{formatPercent(r.gainExp)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="muted">기사{r.party.knight}</Badge>
                <Badge variant="muted">요정{r.party.elf}</Badge>
                <Badge variant="muted">법사{r.party.wizard}</Badge>
                {r.bibigi.enabled && <Badge>비비기 {r.bibigi.count}</Badge>}
                {r.molly && <Badge>몰이</Badge>}
              </div>
              <div className="flex gap-1.5 border-t border-border/[0.08] pt-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => onEdit(r.id)}>
                  <Pencil size={16} />
                  수정
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDuplicate(r.id)}>
                  <Copy size={16} />
                  복제
                </Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={16} />
                  삭제
                </Button>
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
}

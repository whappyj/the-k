import { useMemo, useState } from 'react';
import { Search, RotateCcw, Trash2 } from 'lucide-react';
import type { Calculator24Record, Calculator24Status } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { useConfirm } from '@/hooks/useConfirm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InteractiveCard } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';

const STATUS_BADGE: Record<Exclude<Calculator24Status, null>, string> = {
  achievable: '🟢',
  needMore: '🟠',
  impossible: '🔴',
};

interface HistoryListProps {
  records: Calculator24Record[];
  onLoad: (record: Calculator24Record) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ records, onLoad, onDelete }: HistoryListProps) {
  const { formatPercent } = useFormatters();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    const filtered = search ? records.filter((r) => `${r.startDate} ${r.endDate}`.includes(search)) : records;
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  }, [records, search]);

  const handleDelete = async (id: string) => {
    if (await confirm('이 계산 기록을 삭제하시겠습니까?')) onDelete(id);
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <Input className="pl-10" placeholder="날짜로 검색 (예: 2026-07)" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <EmptyCell>{search ? '검색 결과가 없습니다.' : '저장된 계산 기록이 없습니다.'}</EmptyCell>
      ) : (
        <div className="grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
          {list.map((r) => (
            <InteractiveCard key={r.id} className="flex cursor-default flex-col gap-2 border-t-[3px] border-t-text-faint hover:scale-100 hover:shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-sub">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
                {r.status && <span>{STATUS_BADGE[r.status]}</span>}
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>{formatPercent(r.hourExp)}/h</span>
                <span>{formatPercent(r.dayExp)}/일</span>
              </div>
              <div className="text-xs text-text-faint">{r.expectedLevelUpDate ? `레벨업 예상 ${r.expectedLevelUpDate}` : '레벨업 예상일 없음'}</div>
              <div className="flex gap-1.5 border-t border-border/[0.08] pt-1.5">
                <Button variant="ghost" size="sm" onClick={() => onLoad(r)}>
                  <RotateCcw size={16} />
                  불러오기
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

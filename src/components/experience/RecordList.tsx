import { useMemo, useState } from 'react';
import { Search, Pencil, Copy, Trash2, Download } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { useConfirm } from '@/hooks/useConfirm';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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

const NUM_OPTIONS = Array.from({ length: 9 }, (_, i) => i);

export function RecordList({ records, onEdit, onDuplicate, onDelete }: RecordListProps) {
  const { formatPercent, formatDuration } = useFormatters();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [knight, setKnight] = useState('');
  const [elf, setElf] = useState('');
  const [wizard, setWizard] = useState('');
  const [bibigi, setBibigi] = useState('');
  const [molly, setMolly] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const areaOptions = useMemo(() => Array.from(new Set(records.map((r) => r.huntArea))).sort(), [records]);

  const hasActiveFilter = Boolean(search || area || knight || elf || wizard || bibigi || molly || dateFrom || dateTo);

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (area && r.huntArea !== area) return false;
        if (knight !== '' && r.party.knight !== Number(knight)) return false;
        if (elf !== '' && r.party.elf !== Number(elf)) return false;
        if (wizard !== '' && r.party.wizard !== Number(wizard)) return false;
        if (bibigi === 'on' && !r.bibigi.enabled) return false;
        if (bibigi === 'off' && r.bibigi.enabled) return false;
        if (molly === 'on' && !r.molly) return false;
        if (molly === 'off' && r.molly) return false;
        if (dateFrom && r.startDate < dateFrom) return false;
        if (dateTo && r.startDate > dateTo) return false;
        if (search) {
          const hay = `${r.huntArea} ${r.memo} ${r.startDate}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime());
  }, [records, area, knight, elf, wizard, bibigi, molly, dateFrom, dateTo, search]);

  const list = hasActiveFilter ? filtered : filtered.slice(0, 10);

  const handleDelete = async (id: string) => {
    if (await confirm('이 기록을 삭제하시겠습니까?')) onDelete(id);
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <Input className="pl-10" placeholder="사냥터, 메모, 날짜로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="시작일 필터" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="종료일 필터" />
      </div>

      <div className="mb-4 grid grid-cols-6 gap-2.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        <Select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">사냥터 전체</option>
          {areaOptions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <NumSelect label="기사" value={knight} onChange={setKnight} />
        <NumSelect label="요정" value={elf} onChange={setElf} />
        <NumSelect label="법사" value={wizard} onChange={setWizard} />
        <Select value={bibigi} onChange={(e) => setBibigi(e.target.value)}>
          <option value="">비비기 전체</option>
          <option value="on">비비기 ON</option>
          <option value="off">비비기 OFF</option>
        </Select>
        <Select value={molly} onChange={(e) => setMolly(e.target.value)}>
          <option value="">몰이 전체</option>
          <option value="on">몰이 ON</option>
          <option value="off">몰이 OFF</option>
        </Select>
      </div>

      <div className="mb-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => exportExperienceRecordsCsv(hasActiveFilter ? filtered : records)} disabled={!records.length}>
          <Download size={16} />
          CSV로 내보내기{hasActiveFilter ? ` (필터된 ${filtered.length}건)` : ''}
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyCell>{hasActiveFilter ? '검색/필터 결과가 없습니다.' : '저장된 경험치 기록이 없습니다.'}</EmptyCell>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
          {list.map((r) => (
            <InteractiveCard key={r.id} onClick={() => onEdit(r.id)} className="flex flex-col gap-2.5 cursor-default hover:scale-100 hover:shadow-soft">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="text-[15px] font-bold">{r.huntArea}</div>
                  <div className="mt-0.5 text-xs text-text-sub">
                    {r.startLevel === r.endLevel ? `Lv${r.endLevel}` : `Lv${r.startLevel}→${r.endLevel}`} · {r.startDate} {r.startTime} · {formatDuration(r.playTime)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-faint">등록 {new Date(r.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold">{formatPercent(r.expPerHour)}/h</div>
                  <div className="text-text-sub">{formatPercent(r.startExp)} → {formatPercent(r.endExp)}</div>
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

function NumSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label} 전체</option>
      {NUM_OPTIONS.map((n) => (
        <option key={n} value={n}>{label} {n}</option>
      ))}
    </Select>
  );
}

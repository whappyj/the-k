import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { InteractiveCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyCell } from '@/components/common/EmptyState';

const NUM_OPTIONS = Array.from({ length: 9 }, (_, i) => i);

export function AnalysisRecentList({ records, onSelect, selectedId }: { records: ExperienceRecord[]; onSelect: (id: string) => void; selectedId?: string | null }) {
  const { formatPercent, formatDuration } = useFormatters();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [bibigi, setBibigi] = useState('');
  const [molly, setMolly] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [knight, setKnight] = useState('');
  const [elf, setElf] = useState('');
  const [wizard, setWizard] = useState('');

  const areas = useMemo(() => Array.from(new Set(records.map((r) => r.huntArea))).sort(), [records]);
  const hasFilter = Boolean(search || area || bibigi || molly || from || to || knight || elf || wizard);

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (area && r.huntArea !== area) return false;
        if (bibigi === 'on' && !r.bibigi.enabled) return false;
        if (bibigi === 'off' && r.bibigi.enabled) return false;
        if (molly === 'on' && !r.molly) return false;
        if (molly === 'off' && r.molly) return false;
        if (from && r.startDate < from) return false;
        if (to && r.startDate > to) return false;
        if (knight !== '' && r.party.knight !== Number(knight)) return false;
        if (elf !== '' && r.party.elf !== Number(elf)) return false;
        if (wizard !== '' && r.party.wizard !== Number(wizard)) return false;
        if (search) {
          const hay = `${r.huntArea} ${r.memo} ${r.startDate}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime());
  }, [records, area, bibigi, molly, from, to, knight, elf, wizard, search]);

  const list = hasFilter ? filtered : filtered.slice(0, 20);

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6 max-[1100px]:grid-cols-1">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <Input className="pl-10" placeholder="사냥터, 메모, 날짜로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">사냥터 전체</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
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
        <div className="flex flex-col gap-1.5">
          <Input type="date" title="기간 시작" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" title="기간 종료" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Select value={knight} onChange={(e) => setKnight(e.target.value)}>
          <option value="">기사 전체</option>
          {NUM_OPTIONS.map((n) => <option key={n} value={n}>기사 {n}</option>)}
        </Select>
        <Select value={elf} onChange={(e) => setElf(e.target.value)}>
          <option value="">요정 전체</option>
          {NUM_OPTIONS.map((n) => <option key={n} value={n}>요정 {n}</option>)}
        </Select>
        <Select value={wizard} onChange={(e) => setWizard(e.target.value)}>
          <option value="">법사 전체</option>
          {NUM_OPTIONS.map((n) => <option key={n} value={n}>법사 {n}</option>)}
        </Select>
      </div>

      <div className="min-w-0">
        {list.length === 0 ? (
          <EmptyCell>{hasFilter ? '검색/필터 결과가 없습니다.' : '경험치 기록이 없습니다.'}</EmptyCell>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
            {list.map((r) => (
              <InteractiveCard
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={`flex min-h-[104px] flex-col justify-center gap-2.5 border-l-[3px] p-5 transition-colors duration-200 hover:border-l-gold hover:bg-gold-dim/40 ${
                  r.id === selectedId ? 'border-l-gold bg-gold-dim/50' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <div className="text-[15px] font-bold">{r.huntArea}</div>
                    <div className="mt-0.5 text-xs text-text-sub">{r.startDate} · {formatDuration(r.playTime)}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-display font-bold">{formatPercent(r.expPerHour)}/h</div>
                    <div className="text-text-sub">{formatPercent(r.gainExp)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="muted">기사{r.party.knight}</Badge>
                  <Badge variant="muted">요정{r.party.elf}</Badge>
                  <Badge variant="muted">법사{r.party.wizard}</Badge>
                  {r.bibigi.enabled && <Badge>비비기 {r.bibigi.count}</Badge>}
                  {r.molly && <Badge>몰이</Badge>}
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

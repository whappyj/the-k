import { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { useConfirm } from '@/hooks/useConfirm';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyCell } from '@/components/common/EmptyState';
import { RecordDetailPanel } from '@/components/analysis/RecordDetailPanel';
import { cn } from '@/utils/cn';

export function AnalysisRecentList({
  records,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  records: ExperienceRecord[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { formatPercent, formatDuration } = useFormatters();
  const { confirm } = useConfirm();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [mode, setMode] = useState(''); // '' | 'solo' | 'party'
  const [bibigi, setBibigi] = useState('');
  const [molly, setMolly] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const areas = useMemo(() => Array.from(new Set(records.map((r) => r.huntArea))).sort(), [records]);
  const hasFilter = Boolean(search || area || mode || bibigi || molly || from || to);

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (area && r.huntArea !== area) return false;
        const isParty = r.party.knight + r.party.elf + r.party.wizard > 0;
        if (mode === 'solo' && isParty) return false;
        if (mode === 'party' && !isParty) return false;
        if (bibigi === 'on' && !r.bibigi.enabled) return false;
        if (bibigi === 'off' && r.bibigi.enabled) return false;
        if (molly === 'on' && !r.molly) return false;
        if (molly === 'off' && r.molly) return false;
        if (from && r.startDate < from) return false;
        if (to && r.startDate > to) return false;
        if (search) {
          const hay = `${r.huntArea} ${r.memo} ${r.startDate}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime());
  }, [records, area, mode, bibigi, molly, from, to, search]);

  const list = hasFilter ? filtered : filtered.slice(0, 20);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#1D2530] bg-[#0B1016] p-6 shadow-[0_4px_14px_rgba(0,0,0,0.28)]">
        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input className="pl-10" placeholder="사냥터, 메모, 날짜로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">사냥터 전체</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">사냥방식 전체</option>
            <option value="solo">단독사냥</option>
            <option value="party">파티사냥</option>
          </Select>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="rounded-xl border border-[#1D2530] bg-white/[0.02] px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-text-sub transition-colors duration-200 hover:bg-white/[0.045] hover:text-white"
          >
            {showAdvanced ? '▲ 고급 필터 접기' : '▼ 고급 필터 (몰이·비비기·기간)'}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
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
            <Input type="date" title="기간 시작" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" title="기간 종료" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        {list.length === 0 ? (
          <EmptyCell>{hasFilter ? '검색/필터 결과가 없습니다.' : '경험치 기록이 없습니다.'}</EmptyCell>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#1D2530] shadow-[0_4px_14px_rgba(0,0,0,0.28)]">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[#1D2530] bg-white/[0.02] text-left text-[11.5px] text-text-faint">
                  <th className="px-4 py-2.5 font-semibold">날짜</th>
                  <th className="px-4 py-2.5 font-semibold">사냥터</th>
                  <th className="px-4 py-2.5 font-semibold">사냥시간</th>
                  <th className="px-4 py-2.5 text-right font-semibold">경험치(%/h)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">획득</th>
                  <th className="px-4 py-2.5 text-center font-semibold">상세</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const isOpen = r.id === expandedId;
                  return (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                        className={cn('cursor-pointer border-b border-[#1D2530] last:border-none hover:bg-white/[0.045]', isOpen && 'bg-primary-dim/30')}
                      >
                        <td className="px-4 py-2.5 text-text-sub">{r.startDate}</td>
                        <td className="min-w-0 break-words px-4 py-2.5 font-semibold text-white">{r.huntArea}</td>
                        <td className="px-4 py-2.5 text-text-sub">{formatDuration(r.playTime)}</td>
                        <td className="px-4 py-2.5 text-right font-display font-bold text-primary">{formatPercent(r.expPerHour)}/h</td>
                        <td className="px-4 py-2.5 text-right text-text-sub">{formatPercent(r.gainExp)}</td>
                        <td className="px-4 py-2.5 text-center text-text-faint">
                          {isOpen ? <ChevronUp size={16} className="mx-auto text-primary" /> : <ChevronDown size={16} className="mx-auto" />}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${r.id}-detail`} className="border-b border-[#1D2530] bg-primary-dim/10 last:border-none">
                          <td colSpan={6} className="p-6">
                            <div className="animate-accordion-in">
                            <div className="mb-4 flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDuplicate(r.id)}
                              >
                                <Copy size={16} />
                                복제
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger hover:bg-danger/10"
                                onClick={async () => {
                                  if (await confirm('이 기록을 삭제하시겠습니까?')) {
                                    onDelete(r.id);
                                    setExpandedId(null);
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                                삭제
                              </Button>
                            </div>
                            <RecordDetailPanel record={r} allRecords={records} onEdit={onEdit} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

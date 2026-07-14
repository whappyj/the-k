import { useState } from 'react';
import { Search, Trophy, X } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { computeStats } from '@/lib/analysis';
import { cn } from '@/utils/cn';

/**
 * components/compare/RecordVsRecord.tsx
 * "비교" 화면의 "기록 vs 기록" 모드 — 저장된 기록 두 개를 골라 나란히 비교한다.
 * 승패/차이/추천 문장은 전부 이미 저장된 값(expPerHour/gainExp/playTime/molly 등)과
 * computeStats() 전체 평균을 단순 비교·조합해서 만든 표시일 뿐, 새 계산식은 전혀 추가하지 않는다.
 */
export function RecordVsRecord({ records }: { records: ExperienceRecord[] }) {
  const [selectedA, setSelectedA] = useState<ExperienceRecord | null>(null);
  const [selectedB, setSelectedB] = useState<ExperienceRecord | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <RecordPicker label="기록 A" accent="blue" records={records} selected={selectedA} onSelect={setSelectedA} exclude={selectedB?.id} />
        <RecordPicker label="기록 B" accent="green" records={records} selected={selectedB} onSelect={setSelectedB} exclude={selectedA?.id} />
      </div>

      {selectedA && selectedB && <ComparisonResult a={selectedA} b={selectedB} allRecords={records} />}
    </div>
  );
}

function RecordPicker({
  label,
  accent,
  records,
  selected,
  onSelect,
  exclude,
}: {
  label: string;
  accent: 'blue' | 'green';
  records: ExperienceRecord[];
  selected: ExperienceRecord | null;
  onSelect: (r: ExperienceRecord | null) => void;
  exclude?: string;
}) {
  const { formatPercent } = useFormatters();
  const [query, setQuery] = useState('');
  const accentClass = accent === 'blue' ? 'border-primary/40 text-primary' : 'border-success/40 text-success';

  if (selected) {
    return (
      <Card className={cn('border-2', accentClass)}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
          <button type="button" onClick={() => onSelect(null)} className="text-text-faint hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="text-[17px] font-bold text-white">{selected.huntArea}</div>
        <div className="text-[12px] text-text-faint">
          {selected.startDate} {selected.startTime} · Lv {selected.startLevel}→{selected.endLevel}
        </div>
        <div className="mt-2 font-display text-[22px] font-bold text-white">{formatPercent(selected.expPerHour)}/h</div>
      </Card>
    );
  }

  const matches = query.trim()
    ? records
        .filter((r) => exclude !== r.id)
        .filter((r) => `${r.huntArea} ${r.startDate} ${r.startTime} ${r.startLevel}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <Card className={cn('border-2 border-dashed', accent === 'blue' ? 'border-primary/25' : 'border-success/25')}>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-faint">{label}</div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <Input className="pl-9" placeholder="사냥터, 날짜, 레벨로 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {matches.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {matches.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-white/[0.05]"
            >
              <span className="truncate font-semibold">{r.huntArea}</span>
              <span className="shrink-0 text-text-faint">
                {r.startDate} · Lv{r.startLevel}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function ComparisonResult({ a, b, allRecords }: { a: ExperienceRecord; b: ExperienceRecord; allRecords: ExperienceRecord[] }) {
  const { formatPercent, formatDuration } = useFormatters();
  const overallAvg = computeStats(allRecords).avgPerHour;

  const rateWinner = a.expPerHour === b.expPerHour ? null : a.expPerHour > b.expPerHour ? 'A' : 'B';
  const rateDiffPct = Math.min(a.expPerHour, b.expPerHour) > 0 ? (Math.abs(a.expPerHour - b.expPerHour) / Math.min(a.expPerHour, b.expPerHour)) * 100 : 0;

  const minuteWinner = a.expPerMinute === b.expPerMinute ? null : a.expPerMinute > b.expPerMinute ? 'A' : 'B';
  const minuteDiffPct = Math.min(a.expPerMinute, b.expPerMinute) > 0 ? (Math.abs(a.expPerMinute - b.expPerMinute) / Math.min(a.expPerMinute, b.expPerMinute)) * 100 : 0;

  const playTimeDiff = Math.abs(a.playTime - b.playTime);
  const gainDiff = Math.abs(a.gainExp - b.gainExp);

  const winnerRecord = rateWinner === 'A' ? a : rateWinner === 'B' ? b : null;
  const loserRecord = rateWinner === 'A' ? b : rateWinner === 'B' ? a : null;
  const winnerLabel = rateWinner;

  // 추천 문장 — 전부 이미 계산된 값끼리 비교/조합만 한다.
  const sentences: string[] = [];
  if (winnerRecord && winnerLabel) {
    sentences.push(`${winnerLabel}가 효율이 더 좋습니다.`);
    if (loserRecord && loserRecord.playTime < winnerRecord.playTime) {
      sentences.push(`${winnerLabel === 'A' ? 'B' : 'A'}는 사냥시간은 짧지만 경험치 효율은 낮습니다.`);
    }
    if (winnerRecord.molly && overallAvg > 0 && winnerRecord.expPerHour > overallAvg) {
      const diffFromAvg = ((winnerRecord.expPerHour - overallAvg) / overallAvg) * 100;
      sentences.push(`몰이를 사용한 ${winnerLabel}가 평균보다 ${diffFromAvg.toFixed(0)}% 높습니다.`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* VS 헤더 */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <RecordHeadline record={a} label="A" accent="blue" isChampion={rateWinner === 'A'} />
        <div className="font-display text-[22px] font-extrabold text-text-faint">VS</div>
        <RecordHeadline record={b} label="B" accent="green" isChampion={rateWinner === 'B'} />
      </div>

      {/* 시간당 경험치 막대그래프 */}
      <Card>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-text-sub">시간당 경험치 비교</div>
        <div className="flex flex-col gap-2.5">
          <BarRow label="A" value={a.expPerHour} max={Math.max(a.expPerHour, b.expPerHour, 1)} color="#4F8CFF" display={`${formatPercent(a.expPerHour)}/h`} />
          <BarRow label="B" value={b.expPerHour} max={Math.max(a.expPerHour, b.expPerHour, 1)} color="#2ECC71" display={`${formatPercent(b.expPerHour)}/h`} />
        </div>
      </Card>

      {/* 비교 항목 */}
      <Card>
        <CompareRow label="시간당 경험치" a={`${formatPercent(a.expPerHour)}/h`} b={`${formatPercent(b.expPerHour)}/h`} result={rateWinner ? `${rateWinner} 승 +${rateDiffPct.toFixed(1)}%` : '동일'} resultTone={rateWinner ? 'win' : 'neutral'} />
        <CompareRow label="분당 경험치" a={`${formatPercent(a.expPerMinute)}/min`} b={`${formatPercent(b.expPerMinute)}/min`} result={minuteWinner ? `${minuteWinner} 승 +${minuteDiffPct.toFixed(1)}%` : '동일'} resultTone={minuteWinner ? 'win' : 'neutral'} />
        <CompareRow label="사냥 시간" a={formatDuration(a.playTime)} b={formatDuration(b.playTime)} result={`차이 ${formatDuration(playTimeDiff)}`} resultTone="neutral" />
        <CompareRow label="총 획득 경험치" a={formatPercent(a.gainExp)} b={formatPercent(b.gainExp)} result={`차이 ${formatPercent(gainDiff)}`} resultTone="neutral" />
        <CompareRow label="레벨" a={`Lv ${a.startLevel}→${a.endLevel}`} b={`Lv ${b.startLevel}→${b.endLevel}`} />
        <CompareRow label="기사 / 요정 / 법사" a={`${a.party.knight}/${a.party.elf}/${a.party.wizard}`} b={`${b.party.knight}/${b.party.elf}/${b.party.wizard}`} />
        <CompareRow label="몰이" a={a.molly ? 'ON' : 'OFF'} b={b.molly ? 'ON' : 'OFF'} />
        <CompareRow label="비비기" a={a.bibigi.enabled ? `ON(${a.bibigi.count})` : 'OFF'} b={b.bibigi.enabled ? `ON(${b.bibigi.count})` : 'OFF'} />
        {(a.memo || b.memo) && <CompareRow label="메모" a={a.memo || '-'} b={b.memo || '-'} />}
      </Card>

      {/* 추천 */}
      {sentences.length > 0 && (
        <Card className="border-gold/30 bg-gold-dim">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gold">추천 분석</div>
          <ul className="flex flex-col gap-1.5">
            {sentences.map((s, i) => (
              <li key={i} className="text-[13px] text-text">
                • {s}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function RecordHeadline({ record, label, accent, isChampion }: { record: ExperienceRecord; label: string; accent: 'blue' | 'green'; isChampion: boolean }) {
  const { formatPercent } = useFormatters();
  const accentColor = accent === 'blue' ? 'text-primary' : 'text-success';
  return (
    <Card className={cn('relative text-center', isChampion && 'border-gold/50')}>
      {isChampion && (
        <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0B1016] bg-gold text-[#1A1408]">
          <Trophy size={14} />
        </span>
      )}
      <div className={cn('mb-1 text-[11px] font-bold uppercase tracking-wide', accentColor)}>{label}</div>
      <div className="mb-1 truncate text-[15px] font-bold text-white">{record.huntArea}</div>
      <div className="font-display text-[28px] font-bold text-white">{formatPercent(record.expPerHour)}/h</div>
    </Card>
  );
}

function BarRow({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 text-center text-[12px] font-bold text-text-sub">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(4, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="w-20 shrink-0 text-right font-display text-[12.5px] font-bold">{display}</span>
    </div>
  );
}

function CompareRow({
  label,
  a,
  b,
  result,
  resultTone,
}: {
  label: string;
  a: string;
  b: string;
  result?: string;
  resultTone?: 'win' | 'neutral';
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#1D2530] py-3 last:border-none">
      <div className="text-right text-[13.5px] font-semibold text-white">{a}</div>
      <div className="w-32 text-center">
        <div className="text-[10.5px] text-text-faint">{label}</div>
        {result && <div className={cn('text-[10.5px] font-bold', resultTone === 'win' ? 'text-gold' : 'text-text-sub')}>{result}</div>}
      </div>
      <div className="text-left text-[13.5px] font-semibold text-white">{b}</div>
    </div>
  );
}

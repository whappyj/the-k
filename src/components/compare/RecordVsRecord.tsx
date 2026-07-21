import { useMemo, useState } from 'react';
import { Trophy, Check, X } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

/**
 * components/compare/RecordVsRecord.tsx
 * "비교" 화면의 "기록 vs 기록" 모드 — 기록 테이블에서 행을 클릭해 A/B 두 개를 고르면
 * 나란히 비교한다. 승패/차이는 전부 이미 저장된 값(expPerHour/gainExp/playTime 등)을
 * 단순 비교한 표시일 뿐, 새 계산식은 전혀 추가하지 않는다.
 */
export function RecordVsRecord({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...records].sort((x, y) => new Date(`${y.startDate}T${y.startTime}`).getTime() - new Date(`${x.startDate}T${x.startTime}`).getTime()),
    [records]
  );

  const a = records.find((r) => r.id === aId) ?? null;
  const b = records.find((r) => r.id === bId) ?? null;

  const handleRowClick = (id: string) => {
    if (id === aId) return setAId(null);
    if (id === bId) return setBId(null);
    if (!aId) return setAId(id);
    if (!bId) return setBId(id);
    setAId(id); // 둘 다 찬 상태에서 새로 클릭하면 A를 교체
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <SlotChip label="기록 A" color="#4F8CFF" record={a} onClear={() => setAId(null)} />
        <SlotChip label="기록 B" color="#2ECC71" record={b} onClear={() => setBId(null)} />
      </div>

      <Card className="p-6">
        <div className="mb-4 text-[12.5px] text-text-faint">기록을 눌러 A → B 순서로 선택하세요.</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[#1D2530] text-left text-[11.5px] text-text-faint">
                <th className="px-4 py-2.5 font-semibold">날짜</th>
                <th className="px-4 py-2.5 font-semibold">사냥터</th>
                <th className="px-4 py-2.5 font-semibold">레벨</th>
                <th className="px-4 py-2.5 text-right font-semibold">경험치(%/h)</th>
                <th className="px-4 py-2.5 text-center font-semibold">선택</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const tag = r.id === aId ? 'A' : r.id === bId ? 'B' : null;
                return (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r.id)}
                    className={cn('cursor-pointer border-b border-[#1D2530] last:border-none hover:bg-white/[0.045]', tag && 'bg-primary-dim/30')}
                  >
                    <td className="px-4 py-2.5 text-text-sub">{r.startDate}</td>
                    <td className="min-w-0 break-words px-4 py-2.5 font-semibold text-white">{r.huntArea}</td>
                    <td className="px-4 py-2.5 text-text-sub">Lv{r.startLevel}→{r.endLevel}</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-primary">{formatPercent(r.expPerHour)}/h</td>
                    <td className="px-4 py-2.5 text-center">
                      {tag ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ background: tag === 'A' ? '#4F8CFF' : '#2ECC71' }}
                        >
                          {tag}
                        </span>
                      ) : (
                        <Check size={16} className="mx-auto text-transparent" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {a && b && <ComparisonResult a={a} b={b} />}
    </div>
  );
}

function SlotChip({ label, color, record, onClear }: { label: string; color: string; record: ExperienceRecord | null; onClear: () => void }) {
  const { formatPercent } = useFormatters();
  return (
    <Card className={cn('border-2', record ? '' : 'border-dashed')} style={{ borderColor: record ? color : undefined }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
        {record && (
          <button type="button" onClick={onClear} className="rounded-lg p-1 text-text-faint transition-colors hover:bg-white/[0.08] hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>
      {record ? (
        <>
          <div className="min-w-0 break-words text-[17px] font-bold text-white">{record.huntArea}</div>
          <div className="text-[12px] text-text-faint">
            {record.startDate} {record.startTime} · Lv {record.startLevel}→{record.endLevel}
          </div>
          <div className="mt-2 font-display text-[22px] font-bold text-white">{formatPercent(record.expPerHour)}/h</div>
        </>
      ) : (
        <div className="text-[13px] text-text-faint">아래 표에서 기록을 선택하세요</div>
      )}
    </Card>
  );
}

function ComparisonResult({ a, b }: { a: ExperienceRecord; b: ExperienceRecord }) {
  const { formatPercent, formatDuration } = useFormatters();

  const rateWinner = a.expPerHour === b.expPerHour ? null : a.expPerHour > b.expPerHour ? 'A' : 'B';
  const rateDiffPct = Math.min(a.expPerHour, b.expPerHour) > 0 ? (Math.abs(a.expPerHour - b.expPerHour) / Math.min(a.expPerHour, b.expPerHour)) * 100 : 0;

  const playTimeDiff = Math.abs(a.playTime - b.playTime);
  const gainDiff = Math.abs(a.gainExp - b.gainExp);

  return (
    <div className="flex flex-col gap-4">
      {/* A VS B — 시간당 경험치를 막대와 함께 즉시 비교 (0.5초 안에 승자 파악) */}
      <Card>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6">
          <HeadToHead record={a} label="A" accent="#4F8CFF" isChampion={rateWinner === 'A'} maxRate={Math.max(a.expPerHour, b.expPerHour, 1)} />
          <div className="pt-6 font-display text-[20px] font-extrabold text-text-faint">VS</div>
          <HeadToHead record={b} label="B" accent="#2ECC71" isChampion={rateWinner === 'B'} align="right" maxRate={Math.max(a.expPerHour, b.expPerHour, 1)} />
        </div>
        {rateWinner && (
          <div className="mt-4 text-center text-[13px] font-bold text-gold">
            🏆 {rateWinner} 승리 · 시간당 경험치 +{rateDiffPct.toFixed(1)}% 더 높음
          </div>
        )}
      </Card>

      {/* 핵심 비교 항목 */}
      <Card>
        <CompareRow label="총 획득 경험치" a={formatPercent(a.gainExp)} b={formatPercent(b.gainExp)} result={`차이 ${formatPercent(gainDiff)}`} resultTone="neutral" />
        <CompareRow label="사냥 시간" a={formatDuration(a.playTime)} b={formatDuration(b.playTime)} result={`차이 ${formatDuration(playTimeDiff)}`} resultTone="neutral" />
        <CompareRow label="레벨" a={`Lv ${a.startLevel}→${a.endLevel}`} b={`Lv ${b.startLevel}→${b.endLevel}`} />
        <CompareRow label="사냥터" a={a.huntArea} b={b.huntArea} />
      </Card>
    </div>
  );
}

function HeadToHead({ record, label, accent, isChampion, align = 'left', maxRate }: { record: ExperienceRecord; label: string; accent: string; isChampion: boolean; align?: 'left' | 'right'; maxRate: number }) {
  const { formatPercent } = useFormatters();
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div className={cn('mb-1.5 flex items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
          {label}
        </span>
        {isChampion && <Trophy size={16} className="text-gold" />}
      </div>
      <div className="mb-2 break-words text-[13px] font-semibold text-text-sub">{record.huntArea}</div>
      <div className="mb-2 font-display text-[36px] font-bold leading-none" style={{ color: isChampion ? '#D6A84F' : accent }}>
        {formatPercent(record.expPerHour)}
        <span className="text-[14px] opacity-70">/h</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn('h-full rounded-full transition-all duration-300', align === 'right' && 'ml-auto')}
          style={{ width: `${Math.max(6, (record.expPerHour / maxRate) * 100)}%`, background: isChampion ? '#D6A84F' : accent }}
        />
      </div>
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
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-[#1D2530] py-3 last:border-none">
      <div className="min-w-0 break-words text-right text-[13.5px] font-semibold text-white">{a}</div>
      <div className="w-32 shrink-0 text-center">
        <div className="text-[10.5px] text-text-faint">{label}</div>
        {result && <div className={cn('text-[10.5px] font-bold', resultTone === 'win' ? 'text-gold' : 'text-text-sub')}>{result}</div>}
      </div>
      <div className="min-w-0 break-words text-left text-[13.5px] font-semibold text-white">{b}</div>
    </div>
  );
}

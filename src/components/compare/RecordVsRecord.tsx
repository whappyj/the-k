import { useMemo, useState } from 'react';
import { Trophy, X, ArrowRightLeft } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';

/**
 * components/compare/RecordVsRecord.tsx
 * 저장된 경험치 기록 두 개를 골라 나란히 비교하는 컴포넌트. 경험치 기록 화면의 "비교" 탭에서
 * 사용한다. 승패/차이는 전부 이미 저장된 값(expPerHour/gainExp/playTime 등)을 단순 비교한
 * 표시일 뿐이며, 새 계산식은 전혀 추가하지 않는다.
 */
export function RecordVsRecord({ records }: { records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...records].sort((x, y) => new Date(`${y.startDate}T${y.startTime}`).getTime() - new Date(`${x.startDate}T${x.startTime}`).getTime()),
    [records]
  );

  const recordA = records.find((r) => r.id === slotA) ?? null;
  const recordB = records.find((r) => r.id === slotB) ?? null;

  const pickRecord = (id: string) => {
    if (id === slotA) return setSlotA(null);
    if (id === slotB) return setSlotB(null);
    if (!slotA) return setSlotA(id);
    if (!slotB) return setSlotB(id);
    setSlotA(id);
  };

  if (!records.length) {
    return <EmptyState icon={ArrowRightLeft} title="비교할 기록이 없습니다" description="경험치 기록을 저장하면 두 개를 골라 직접 비교할 수 있습니다." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        <PickedSlot label="기록 A" accent="#4F8CFF" record={recordA} onClear={() => setSlotA(null)} />
        <PickedSlot label="기록 B" accent="#2ECC71" record={recordB} onClear={() => setSlotB(null)} />
      </div>

      <Card className="p-7">
        <div className="mb-4 text-[12.5px] text-text-faint">아래 기록을 눌러 A → B 순서로 선택하세요. 다시 누르면 선택이 해제됩니다.</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-[13.5px]">
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
                const tag = r.id === slotA ? 'A' : r.id === slotB ? 'B' : null;
                return (
                  <tr
                    key={r.id}
                    onClick={() => pickRecord(r.id)}
                    className={cn('cursor-pointer border-b border-[#1D2530] last:border-none hover:bg-white/[0.045]', tag && 'bg-primary-dim/30')}
                  >
                    <td className="px-4 py-2.5 text-text-sub">{r.startDate}</td>
                    <td className="min-w-0 break-words px-4 py-2.5 font-semibold text-white">{r.huntArea}</td>
                    <td className="px-4 py-2.5 text-text-sub">Lv{r.startLevel}→{r.endLevel}</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-primary">{formatPercent(r.expPerHour)}/h</td>
                    <td className="px-4 py-2.5 text-center">
                      {tag && (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ background: tag === 'A' ? '#4F8CFF' : '#2ECC71' }}
                        >
                          {tag}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {recordA && recordB && <ComparisonPanel a={recordA} b={recordB} />}
    </div>
  );
}

function PickedSlot({ label, accent, record, onClear }: { label: string; accent: string; record: ExperienceRecord | null; onClear: () => void }) {
  const { formatPercent } = useFormatters();
  return (
    <Card className={cn('border-2', record ? '' : 'border-dashed')} style={{ borderColor: record ? accent : undefined }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>{label}</span>
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

function ComparisonPanel({ a, b }: { a: ExperienceRecord; b: ExperienceRecord }) {
  const { formatPercent, formatDuration } = useFormatters();

  const winner = a.expPerHour === b.expPerHour ? null : a.expPerHour > b.expPerHour ? 'A' : 'B';
  const diffPct = Math.min(a.expPerHour, b.expPerHour) > 0 ? (Math.abs(a.expPerHour - b.expPerHour) / Math.min(a.expPerHour, b.expPerHour)) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-7">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-5">
          <Side record={a} label="A" accent="#4F8CFF" isWinner={winner === 'A'} maxRate={Math.max(a.expPerHour, b.expPerHour, 1)} />
          <div className="pt-6 font-display text-[20px] font-extrabold text-text-faint">VS</div>
          <Side record={b} label="B" accent="#2ECC71" isWinner={winner === 'B'} align="right" maxRate={Math.max(a.expPerHour, b.expPerHour, 1)} />
        </div>
        {winner && (
          <div className="mt-4 text-center text-[13px] font-bold text-gold">
            🏆 {winner} 승리 · 시간당 경험치 +{diffPct.toFixed(1)}% 더 높음
          </div>
        )}
      </Card>

      <Card className="p-7">
        <Row label="총 획득 경험치" a={formatPercent(a.gainExp)} b={formatPercent(b.gainExp)} diff={`차이 ${formatPercent(Math.abs(a.gainExp - b.gainExp))}`} />
        <Row label="사냥 시간" a={formatDuration(a.playTime)} b={formatDuration(b.playTime)} diff={`차이 ${formatDuration(Math.abs(a.playTime - b.playTime))}`} />
        <Row label="레벨" a={`Lv ${a.startLevel}→${a.endLevel}`} b={`Lv ${b.startLevel}→${b.endLevel}`} last />
      </Card>
    </div>
  );
}

function Side({
  record,
  label,
  accent,
  isWinner,
  align = 'left',
  maxRate,
}: {
  record: ExperienceRecord;
  label: string;
  accent: string;
  isWinner: boolean;
  align?: 'left' | 'right';
  maxRate: number;
}) {
  const { formatPercent } = useFormatters();
  const barPct = Math.max(4, (record.expPerHour / maxRate) * 100);
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div className={cn('mb-1.5 flex items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>{label}</span>
        {isWinner && <Trophy size={16} className="text-gold" />}
      </div>
      <div className="mb-2 break-words text-[13px] font-semibold text-text-sub">{record.huntArea}</div>
      <div className="mb-2 font-display text-[34px] font-bold leading-none" style={{ color: isWinner ? '#D6A84F' : accent }}>
        {formatPercent(record.expPerHour)}
        <span className="text-[14px] text-text-faint">/h</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className={cn('h-full rounded-full transition-all duration-300', align === 'right' && 'ml-auto')} style={{ width: `${barPct}%`, background: accent }} />
      </div>
    </div>
  );
}

function Row({ label, a, b, diff, last }: { label: string; a: string; b: string; diff?: string; last?: boolean }) {
  return (
    <div className={cn('grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3', !last && 'border-b border-[#1D2530]')}>
      <div className="text-right text-[14px] font-semibold text-white">{a}</div>
      <div className="w-28 text-center text-[11px] text-text-faint">
        <div>{label}</div>
        {diff && <div className="mt-0.5 text-[10px] text-text-faint">{diff}</div>}
      </div>
      <div className="text-left text-[14px] font-semibold text-white">{b}</div>
    </div>
  );
}

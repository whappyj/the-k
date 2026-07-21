import { Star, Pencil } from 'lucide-react';
import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computeStats } from '@/lib/analysis';
import { cn } from '@/utils/cn';

/**
 * components/analysis/RecordDetailPanel.tsx
 * "기록 목록" 우측 상세정보 — 목록에서 클릭한 기록 하나를 넓은 카드로 보여준다.
 * 사냥터/레벨/사냥시간/총경험치/시간당경험치/파티/몰이/비비기/메모 + 전체 평균 대비
 * 별점·퍼센트·한줄평. 전부 이미 저장된 값과 computeStats() 평균만으로 계산한 표시값이며
 * 새 계산식이나 데이터 필드는 추가하지 않는다.
 */
export function RecordDetailPanel({ record, allRecords, onEdit }: { record: ExperienceRecord | null; allRecords: ExperienceRecord[]; onEdit: (id: string) => void }) {
  const { formatPercent, formatDuration } = useFormatters();

  if (!record) {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center text-center text-[13px] text-text-faint">
        왼쪽 목록에서 기록을 선택하면
        <br />
        상세 정보가 여기에 표시됩니다.
      </Card>
    );
  }

  const overallAvg = computeStats(allRecords).avgPerHour;
  const diffPct = overallAvg > 0 ? ((record.expPerHour - overallAvg) / overallAvg) * 100 : 0;
  const stars = diffPct >= 40 ? 5 : diffPct >= 20 ? 4 : diffPct >= 0 ? 3 : diffPct >= -20 ? 2 : 1;
  const comment =
    diffPct >= 20
      ? `평균보다 ${diffPct.toFixed(0)}% 높은 훌륭한 기록입니다.`
      : diffPct >= 0
        ? `평균보다 ${diffPct.toFixed(0)}% 높은 준수한 기록입니다.`
        : `평균보다 ${Math.abs(diffPct).toFixed(0)}% 낮은 기록입니다.`;

  return (
    <Card className="p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-text-faint">선택한 기록</div>
          <div className="text-[18px] font-bold text-white">{record.huntArea}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEdit(record.id)}>
          <Pencil size={16} />
          수정하기
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-dim to-transparent p-6 text-center">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/80">시간당 경험치</div>
        <div className="font-display text-[40px] font-bold leading-none text-primary">
          {formatPercent(record.expPerHour)}
          <span className="text-[16px] text-primary/70">/h</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4 max-[480px]:grid-cols-2">
        <DetailStat label="사냥 시간" value={formatDuration(record.playTime)} />
        <DetailStat label="획득 경험치" value={formatPercent(record.gainExp)} />
        <DetailStat label="사냥터" value={record.huntArea} />
        <DetailStat label="레벨" value={`Lv ${record.startLevel}→${record.endLevel}`} />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 border-t border-[#1D2530] pt-4 text-center text-[11px] text-text-faint">
        <div>
          <div className="font-display text-[13px] font-bold text-white">
            {record.party.knight}/{record.party.elf}/{record.party.wizard}
          </div>
          <div>기사/요정/법사</div>
        </div>
        <div>
          <div className="font-display text-[13px] font-bold text-white">{record.molly ? 'ON' : 'OFF'}</div>
          <div>몰이</div>
        </div>
        <div>
          <div className="font-display text-[13px] font-bold text-white">{record.bibigi.enabled ? `ON(${record.bibigi.count})` : 'OFF'}</div>
          <div>비비기</div>
        </div>
      </div>

      {record.memo && (
        <div className="mb-6 rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5">
          <div className="mb-1.5 text-[10.5px] font-bold text-text-faint">메모</div>
          <div className="text-[12.5px] text-text-sub">{record.memo}</div>
        </div>
      )}

      <div className="rounded-2xl border border-primary/25 bg-primary-dim p-4 text-center">
        <div className="mb-1.5 flex items-center justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={16} className={cn(i < stars ? 'fill-primary text-primary' : 'text-text-faint')} />
          ))}
        </div>
        <div className={cn('mb-1 font-display text-[16px] font-bold', diffPct >= 0 ? 'text-success' : 'text-danger')}>
          평균 대비 {diffPct >= 0 ? '+' : ''}
          {diffPct.toFixed(0)}%
        </div>
        <div className="text-[11.5px] text-text-sub">{comment}</div>
      </div>
    </Card>
  );
}

function DetailStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1D2530] bg-white/[0.02] p-3.5">
      <div className="mb-1 text-[10.5px] text-text-faint">{label}</div>
      <div className={cn('font-display text-[15px] font-bold', strong ? 'text-primary' : 'text-white')}>{value}</div>
    </div>
  );
}

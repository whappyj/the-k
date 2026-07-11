import type { ExperienceRecord } from '@/types';
import { useFormatters } from '@/hooks/useFormatters';

export function AreaDetail({ area, records }: { area: string; records: ExperienceRecord[] }) {
  const { formatPercent } = useFormatters();
  const list = records
    .filter((r) => r.huntArea === area)
    .sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())
    .slice(0, 5);

  return (
    <div className="mt-4 rounded-2xl border border-[#2A2F38] bg-white/[0.03] p-4">
      <div className="mb-2 text-[13px] font-bold">"{area}" 최근 기록</div>
      {list.map((r) => (
        <div key={r.id} className="flex items-center justify-between border-b border-[#2A2F38] py-2.5 text-[13px] last:border-none">
          <div>
            <div className="font-semibold">{r.startDate} {r.startTime}</div>
            <div className="text-xs text-text-sub">기{r.party.knight}/요{r.party.elf}/법{r.party.wizard}</div>
          </div>
          <span className="font-bold">{formatPercent(r.expPerHour)}</span>
        </div>
      ))}
    </div>
  );
}

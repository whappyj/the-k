import type { EstimateMaterial } from '@/types';
import type { EstimateGroupResult } from '@/lib/calculations';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';

interface MaterialTableProps {
  materials: EstimateMaterial[];
  resA: EstimateGroupResult;
  resB: EstimateGroupResult;
}

export function MaterialTable({ materials, resA, resB }: MaterialTableProps) {
  const { formatNumber } = useFormatters();

  if (!materials.length) {
    return (
      <Card className="rounded-[20px] border-[#2A2D35] bg-[#1B1D22] px-5 py-2">
        <EmptyCell>재료가 없습니다. 아래 "재료 변경"에서 추가해주세요.</EmptyCell>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto rounded-[20px] border-[#2A2D35] bg-[#1B1D22] px-5 py-2">
      <table className="w-full min-w-[520px] border-collapse text-[13px]">
        <thead>
          <tr>
            {['재료명', '필요수량', 'A 가격', 'B 가격', '차이'].map((h, i) => (
              <th key={h} className={cn('sticky top-0 border-b border-[#2A2D35] bg-[#1B1D22]/95 px-3 py-2.5 text-left font-semibold text-[#8A8F9C]', i > 0 && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => {
            const a = resA.rows.find((r) => r.id === m.id)!;
            const b = resB.rows.find((r) => r.id === m.id)!;
            const rowDiff = b.cost - a.cost;
            return (
              <tr key={m.id} className="h-[52px] border-b border-[#2A2D35] transition-colors hover:bg-white/[0.02] last:border-none">
                <td className="px-3 text-white">{m.name}</td>
                <td className="px-3 text-right text-white">{formatNumber(a.neededQty)}</td>
                <td className="px-3 text-right text-white">{formatNumber(a.cost)}</td>
                <td className="px-3 text-right text-white">{formatNumber(b.cost)}</td>
                <td className={cn('px-3 text-right', rowDiff > 0 && 'text-warning', rowDiff < 0 && 'text-success', rowDiff === 0 && 'text-[#8A8F9C]')}>
                  {rowDiff === 0 ? '-' : `${rowDiff > 0 ? '+' : ''}${formatNumber(rowDiff)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

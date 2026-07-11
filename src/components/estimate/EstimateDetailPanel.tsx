import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EstimateMaterial } from '@/types';
import type { EstimateGroupResult } from '@/lib/calculations';
import { MaterialTable } from '@/components/estimate/MaterialTable';

interface EstimateDetailPanelProps {
  materials: EstimateMaterial[];
  resA: EstimateGroupResult;
  resB: EstimateGroupResult;
}

/**
 * components/estimate/EstimateDetailPanel.tsx
 * "상세 재료" 표를 기본 접힘 상태로 감싸는 얇은 래퍼. MaterialTable(계산 결과 표시)은
 * 그대로 재사용하며, 이 파일은 오직 펼침/접힘 UI만 담당한다.
 */
export function EstimateDetailPanel({ materials, resA, resB }: EstimateDetailPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2D35] bg-[#1B1D22] px-4 py-2.5 text-[13px] font-semibold text-[#8A8F9C] transition-colors hover:text-white"
      >
        상세 재료 {open ? '접기' : '펼치기'}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="mt-4">
          <MaterialTable materials={materials} resA={resA} resB={resB} />
        </div>
      )}
    </div>
  );
}

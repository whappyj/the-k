import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { usePendingEdit } from '@/hooks/usePendingEdit';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_ANALYSIS } from '@/lib/helpContent';
import { RecordDetailPanel } from '@/components/analysis/RecordDetailPanel';
import { AnalysisRecentList } from '@/components/analysis/RecentList';
import { EmptyCell } from '@/components/common/EmptyState';

/**
 * pages/Analysis.tsx ("기록목록")
 * 기록 관리 전용 화면 — 검색/필터/정렬(AnalysisRecentList 내부) + 리스트 + 우측 상세정보.
 * 목록에서 클릭하면 화면 이동 없이 우측에 상세 정보(RecordDetailPanel)가 나타나고,
 * "수정하기" 버튼을 눌러야 실제 편집(기록하기 화면 이동)으로 넘어간다 — 기존 편집 기능은
 * 그대로 유지하되 진입 방식만 명확히 분리했다.
 */
export function AnalysisPage() {
  const { data } = useAppData();
  const { setPendingEditId } = usePendingEdit();
  const records = data.experienceRecords;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = records.find((r) => r.id === selectedId) ?? null;

  const handleEdit = (id: string) => {
    setPendingEditId(id);
    window.location.hash = '#experience';
  };

  if (!records.length) {
    return (
      <div id="page-analysis">
        <PageHeader title="📜 기록 목록" subtitle="저장된 사냥 기록을 검색·필터·정렬하여 관리합니다." actions={<HelpButton content={HELP_ANALYSIS} />} />
        <EmptyCell>경험치 기록이 쌓이면 여기서 검색하고 관리할 수 있습니다. 먼저 경험치 기록 페이지에서 기록을 입력해주세요.</EmptyCell>
      </div>
    );
  }

  return (
    <div id="page-analysis">
      <PageHeader title="📜 기록 목록" subtitle="저장된 사냥 기록을 검색·필터·정렬하여 관리합니다." actions={<HelpButton content={HELP_ANALYSIS} />} />

      <div className="grid grid-cols-[1fr_380px] items-start gap-6 max-[1280px]:grid-cols-1">
        <AnalysisRecentList records={records} onSelect={setSelectedId} selectedId={selectedId} />
        <div className="min-w-0">
          <div className="mb-3 text-[13px] font-bold text-text-sub">상세 정보</div>
          <RecordDetailPanel record={selected} allRecords={records} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
}

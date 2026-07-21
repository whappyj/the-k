import { Search } from 'lucide-react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { usePendingEdit } from '@/hooks/usePendingEdit';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_ANALYSIS } from '@/lib/helpContent';
import { AnalysisRecentList } from '@/components/analysis/RecentList';
import { EmptyState } from '@/components/common/EmptyState';
import { generateId } from '@/utils/id';
import { todayStr, nowTimeStr } from '@/utils/date';

/**
 * pages/Analysis.tsx ("기록목록")
 * 기록 관리 전용 화면 — 검색/필터(AnalysisRecentList 내부) + 테이블 + 행 클릭 시 아코디언으로
 * 펼쳐지는 상세정보(RecordDetailPanel 재사용) + 그 안에서 수정/복제/삭제까지 전부 처리한다.
 * 복제/삭제는 기존 경험치 기록 화면과 동일하게 addExperience/deleteExperience 리듀서 액션을
 * 그대로 재사용할 뿐, 새 계산식이나 새 액션 타입은 추가하지 않는다.
 */
export function AnalysisPage() {
  const { data } = useAppData();
  const { addExperience, deleteExperience } = useAppDataActions();
  const { setPendingEditId } = usePendingEdit();
  const { showToast } = useToast();
  const records = data.experienceRecords;

  const handleEdit = (id: string) => {
    setPendingEditId(id);
    window.location.hash = '#experience';
  };

  const handleDuplicate = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    const nowDate = todayStr();
    const nowTime = nowTimeStr();
    addExperience({
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: nowDate,
      startTime: nowTime,
      endDate: nowDate,
      endTime: nowTime,
    });
    showToast('기록을 복제했습니다.', 'success');
  };

  const handleDelete = (id: string) => {
    deleteExperience(id);
    showToast('기록을 삭제했습니다.');
  };

  if (!records.length) {
    return (
      <div id="page-analysis">
        <PageHeader title="📜 기록 목록" actions={<HelpButton content={HELP_ANALYSIS} />} />
        <EmptyState icon={Search} title="기록이 없습니다" description="경험치 기록이 쌓이면 여기서 검색하고 관리할 수 있습니다. 먼저 경험치 기록 페이지에서 기록을 입력해주세요." />
      </div>
    );
  }

  return (
    <div id="page-analysis">
      <PageHeader title="📜 기록 목록" actions={<HelpButton content={HELP_ANALYSIS} />} />
      <AnalysisRecentList records={records} onEdit={handleEdit} onDuplicate={handleDuplicate} onDelete={handleDelete} />
    </div>
  );
}

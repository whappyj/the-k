import { useEffect, useRef, useState } from 'react';
import { Pencil, Scale } from 'lucide-react';
import type { ExperienceFormValues, ExperienceRecord } from '@/types';
import { DEFAULT_HUNT_AREAS, MAX_PARTY } from '@/constants';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/card';
import { usePendingEdit } from '@/hooks/usePendingEdit';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_EXPERIENCE } from '@/lib/helpContent';
import { ExperienceForm } from '@/components/experience/ExperienceForm';
import { ResultPanel } from '@/components/experience/ResultPanel';
import { FavoritePartyList } from '@/components/experience/FavoritePartyList';
import { RecordList } from '@/components/experience/RecordList';
import { RecordVsRecord } from '@/components/compare/RecordVsRecord';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import { computeExperienceStats, validateExperienceForm } from '@/lib/calculations';
import { generateId } from '@/utils/id';
import { todayStr, nowTimeStr } from '@/utils/date';
import { cn } from '@/utils/cn';

/** 가장 최근에 종료된 기록을 찾는다 (레벨/시작경험치 자동 이어받기용). */
function findLastRecord(records: ExperienceRecord[]): ExperienceRecord | null {
  if (!records.length) return null;
  return (
    [...records].sort(
      (a, b) => new Date(`${b.endDate}T${b.endTime}`).getTime() - new Date(`${a.endDate}T${a.endTime}`).getTime()
    )[0] ?? null
  );
}

interface CarryOver {
  startLevel: number;
  startExp: number;
  huntArea?: string;
  knight?: number;
  elf?: number;
  wizard?: number;
  bibigiEnabled?: boolean;
  bibigiCount?: number;
  molly?: boolean;
}

/**
 * carry가 있으면 다음 입력을 최대한 편하게 이어받는다.
 * - 레벨: 직전 기록의 "종료 레벨"을 이번 기록의 "시작 레벨" 기본값으로 채운다 (레벨업 없으면 종료레벨도 같게 채움)
 * - 시작 경험치: 이전 기록의 "종료 경험치"를 자동으로 이어받는다 (연속 사냥 기록 입력 편의)
 * - 사냥터/파티구성: 직전 기록과 동일하게 기본값을 채운다 (매번 다시 고를 필요 없게)
 * carry가 전혀 없으면(최초 사용) 기본 사냥터·기본 레벨 1로 채워 빈 화면으로 시작하지 않게 한다.
 */
function emptyForm(carry?: CarryOver | null): ExperienceFormValues {
  const nowDate = todayStr();
  const nowTime = nowTimeStr();
  const startLevel = carry?.startLevel ?? 1;
  return {
    huntArea: carry?.huntArea ?? DEFAULT_HUNT_AREAS[0],
    startLevel,
    endLevel: startLevel,
    startDate: nowDate, startTime: nowTime, endDate: nowDate, endTime: nowTime,
    townMinutes: 0,
    startExp: carry?.startExp ?? '', endExp: '',
    knight: carry?.knight ?? 1, elf: carry?.elf ?? 1, wizard: carry?.wizard ?? 1,
    bibigiEnabled: carry?.bibigiEnabled ?? false, bibigiCount: carry?.bibigiCount ?? 0, molly: carry?.molly ?? false,
    memo: '',
  };
}

/** ExperienceRecord로부터 CarryOver를 만든다 (직전 기록 이어받기 공용 헬퍼). */
function toCarryOver(record: ExperienceRecord): CarryOver {
  return {
    startLevel: record.endLevel,
    startExp: record.endExp,
    huntArea: record.huntArea,
    knight: record.party.knight,
    elf: record.party.elf,
    wizard: record.party.wizard,
    bibigiEnabled: record.bibigi.enabled,
    bibigiCount: record.bibigi.count,
    molly: record.molly,
  };
}

export function ExperiencePage() {
  const { data } = useAppData();
  const { addExperience, updateExperience, deleteExperience, addFavorite, updateFavorite, deleteFavorite, setRecordDraft, importMerge } =
    useAppDataActions();
  const { showToast } = useToast();
  const { takePendingEditId } = usePendingEdit();

  const [values, setValues] = useState<ExperienceFormValues>(() => {
    const last = findLastRecord(data.experienceRecords);
    const carry = last ? toCarryOver(last) : null;
    return { ...emptyForm(carry), ...(data.recordDraft ?? {}) };
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'input' | 'compare'>('input');
  const formRef = useRef<HTMLDivElement>(null);

  const patch = (p: Partial<ExperienceFormValues>) => setValues((prev) => ({ ...prev, ...p }));

  // 입력 변경 시 초안 자동 저장 (autoSave 설정은 리듀서 내부에서 처리)
  useEffect(() => {
    setRecordDraft(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const loadRecordIntoForm = (record: ExperienceRecord) => {
    setEditingId(record.id);
    setValues({
      huntArea: record.huntArea,
      startLevel: record.startLevel,
      endLevel: record.endLevel,
      startDate: record.startDate, startTime: record.startTime,
      endDate: record.endDate, endTime: record.endTime,
      townMinutes: record.townMinutes,
      startExp: record.startExp, endExp: record.endExp,
      knight: record.party.knight, elf: record.party.elf, wizard: record.party.wizard,
      bibigiEnabled: record.bibigi.enabled, bibigiCount: record.bibigi.count,
      molly: record.molly, memo: record.memo,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 분석 페이지 등에서 "이 기록 수정" 요청이 들어와 있으면 처리
  useEffect(() => {
    const id = takePendingEditId();
    if (!id) return;
    const record = data.experienceRecords.find((r) => r.id === id);
    if (record) loadRecordIntoForm(record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = (carry?: CarryOver | null) => {
    setEditingId(null);
    setValues(
      emptyForm(
        carry !== undefined
          ? carry
          : {
              startLevel: values.endLevel === '' ? 1 : Number(values.endLevel),
              startExp: values.endExp === '' ? 0 : Number(values.endExp),
              huntArea: values.huntArea,
              knight: values.knight,
              elf: values.elf,
              wizard: values.wizard,
              bibigiEnabled: values.bibigiEnabled,
              bibigiCount: values.bibigiCount,
              molly: values.molly,
            }
      )
    );
  };

  const handleSave = () => {
    const error = validateExperienceForm(values, MAX_PARTY);
    if (error) return showToast(error, 'danger');

    const stats = computeExperienceStats(values)!;
    const payload = {
      huntArea: values.huntArea,
      startLevel: Number(values.startLevel),
      endLevel: Number(values.endLevel),
      startDate: values.startDate, startTime: values.startTime,
      endDate: values.endDate, endTime: values.endTime,
      townMinutes: values.townMinutes,
      playTime: stats.playTime,
      startExp: Number(values.startExp), endExp: Number(values.endExp),
      gainExp: stats.gainExp, expPerHour: stats.expPerHour, expPerMinute: stats.expPerMinute,
      party: { knight: values.knight, elf: values.elf, wizard: values.wizard, partyCount: stats.partyCount },
      bibigi: { enabled: values.bibigiEnabled, count: values.bibigiEnabled ? values.bibigiCount : 0 },
      molly: values.molly,
      memo: values.memo,
    };

    if (editingId) {
      updateExperience(editingId, payload);
      showToast('경험치 기록이 수정되었습니다.', 'success', 2000);
    } else {
      addExperience({ id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...payload });
      showToast('경험치 기록이 저장되었습니다.', 'success', 2000);
    }
    resetForm();
    setRecordDraft(null);
  };

  const handleDuplicate = (id: string) => {
    const record = data.experienceRecords.find((r) => r.id === id);
    if (!record) return;
    const nowDate = todayStr();
    const nowTime = nowTimeStr();
    addExperience({
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: nowDate, startTime: nowTime, endDate: nowDate, endTime: nowTime,
    });
    showToast('기록을 복제했습니다.', 'success');
  };

  const handleDelete = (id: string) => {
    deleteExperience(id);
    if (editingId === id) {
      const remaining = data.experienceRecords.filter((r) => r.id !== id);
      const last = findLastRecord(remaining);
      resetForm(last ? toCarryOver(last) : null);
    }
    showToast('기록을 삭제했습니다.');
  };

  const huntAreaOptions = Array.from(new Set([...DEFAULT_HUNT_AREAS, ...data.experienceRecords.map((r) => r.huntArea)]));

  const currentParty = {
    knight: values.knight, elf: values.elf, wizard: values.wizard,
    bibigiEnabled: values.bibigiEnabled, bibigiCount: values.bibigiCount, molly: values.molly,
  };

  const stats = computeExperienceStats(values);

  const handleExportSection = () => {
    exportSection('experience', { experienceRecords: data.experienceRecords, favoriteParties: data.favoriteParties, expGoal: data.expGoal }, '경험치');
    showToast('경험치 데이터를 내보냈습니다.', 'success');
  };

  const handleImportSection = async (file: File) => {
    try {
      const json = await readThekFile(file);
      const result = parseSectionFile<{ experienceRecords?: ExperienceRecord[]; favoriteParties?: typeof data.favoriteParties; expGoal?: typeof data.expGoal }>(
        json,
        'experience'
      );
      if (!result.ok) return showToast(result.error, 'danger');
      importMerge({ experienceRecords: result.data.experienceRecords, favoriteParties: result.data.favoriteParties, expGoal: result.data.expGoal });
      showToast('경험치 데이터를 불러와 병합했습니다. (다른 화면 데이터는 그대로입니다)', 'success', 2500);
    } catch {
      showToast('.thek 파일 형식이 올바르지 않습니다.', 'danger');
    }
  };

  return (
    <div id="page-experience">
      <PageHeader
        title="⚔ 경험치 기록"
                actions={
          <div className="flex items-center gap-2">
            <ImportExportButtons label="경험치" onExport={handleExportSection} onImportFile={handleImportSection} />
            <HelpButton content={HELP_EXPERIENCE} />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
        <TabButton active={tab === 'input'} icon={Pencil} label="기록 입력" onClick={() => setTab('input')} />
        <TabButton active={tab === 'compare'} icon={Scale} label="비교" onClick={() => setTab('compare')} />
      </div>

      {tab === 'compare' ? (
        <RecordVsRecord records={data.experienceRecords} />
      ) : (
        <>
          <div className="mb-12 grid grid-cols-[1.2fr_1fr] items-start gap-6 max-[1100px]:grid-cols-1">
            <div ref={formRef} className="flex min-w-0 flex-col gap-6">
              <ExperienceForm
                values={values}
                onChange={patch}
                huntAreaOptions={huntAreaOptions}
                isEditing={editingId !== null}
                onSave={handleSave}
                onReset={resetForm}
                onCancelEdit={resetForm}
              />
              <Section title="⭐ 즐겨찾는 파티 구성">
                <Card className="p-8">
                  <FavoritePartyList
                    favorites={data.favoriteParties}
                    current={currentParty}
                    onAdd={addFavorite}
                    onUpdate={updateFavorite}
                    onDelete={deleteFavorite}
                    onLoad={(fav) => patch({ knight: fav.knight, elf: fav.elf, wizard: fav.wizard, bibigiEnabled: fav.bibigiEnabled, bibigiCount: fav.bibigiCount, molly: fav.molly })}
                  />
                </Card>
              </Section>
            </div>

            <ResultPanel stats={stats} endExp={values.endExp} />
          </div>

          <Section title="최근 기록">
            <Card className="p-8">
              <RecordList
                records={data.experienceRecords}
                onEdit={(id) => {
                  const record = data.experienceRecords.find((r) => r.id === id);
                  if (record) loadRecordIntoForm(record);
                }}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            </Card>
          </Section>
        </>
      )}
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-[14px] font-bold transition-all duration-200',
        active ? 'border-primary/50 bg-primary-dim text-primary' : 'border-[#1D2530] bg-[#0B1016] text-text-sub hover:bg-white/[0.045]'
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

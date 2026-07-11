import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CalculatorFormValues, Calculator24Record } from '@/types';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { InputPanel } from '@/components/calculator/InputPanel';
import { RealtimeResult, LevelUpCard } from '@/components/calculator/RealtimeResult';
import { GoalCard } from '@/components/calculator/GoalCard';
import { SimulationCard } from '@/components/calculator/SimulationCard';
import { HistoryList } from '@/components/calculator/HistoryList';
import { computeCalculatorCore, computeLevelUp, computeGoal, validateCalculatorForm } from '@/lib/calculations';
import { generateId } from '@/utils/id';
import { todayStr, nowTimeStr } from '@/utils/date';

function emptyForm(): CalculatorFormValues {
  return {
    startDate: '', startTime: '', startExp: '',
    endDate: todayStr(), endTime: nowTimeStr(), endExp: '',
    maintenanceEnabled: false, maintenanceHours: 0,
    currentLevel: '', targetExp: 100, targetDate: '',
  };
}

export function Calculator24Page() {
  const { data } = useAppData();
  const { addCalcRecord, deleteCalcRecord, setCalcDraft } = useAppDataActions();
  const { showToast } = useToast();

  const [values, setValues] = useState<CalculatorFormValues>(() => ({ ...emptyForm(), ...(data.calculatorDraft ?? {}) }));
  const patch = (p: Partial<CalculatorFormValues>) => setValues((prev) => ({ ...prev, ...p }));

  useEffect(() => {
    setCalcDraft(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const core = computeCalculatorCore(values);
  const levelUp = core ? computeLevelUp(values, core) : null;
  const goal = core && levelUp ? computeGoal(values, core, levelUp) : null;

  const handleSave = () => {
    const error = validateCalculatorForm(values, core);
    if (error) return showToast(error, 'danger');
    if (!core || !levelUp) return;

    const record: Calculator24Record = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      startDate: values.startDate, startTime: values.startTime,
      endDate: values.endDate, endTime: values.endTime,
      startExp: Number(values.startExp), endExp: Number(values.endExp),
      maintenanceEnabled: values.maintenanceEnabled, maintenanceHours: values.maintenanceHours,
      totalHours: core.totalHours, playHours: core.playHours, gainExp: core.gainExp,
      hourExp: core.hourExp, minuteExp: core.minuteExp, dayExp: core.dayExp,
      currentLevel: values.currentLevel,
      remainExp: levelUp.remainExp, remainHours: levelUp.remainHours, remainDays: levelUp.remainDays,
      expectedLevelUpDate: levelUp.expectedDate ? levelUp.expectedDate.toISOString().slice(0, 10) : null,
      expectedLevelUpTime: levelUp.expectedDate ? levelUp.expectedDate.toTimeString().slice(0, 5) : null,
      targetDate: values.targetDate || null,
      requiredHourExp: goal && !goal.invalid ? goal.requiredHourExp : null,
      requiredDayExp: goal && !goal.invalid ? goal.requiredDayExp : null,
      status: goal && !goal.invalid ? goal.status : null,
    };

    addCalcRecord(record);
    showToast('계산 기록을 저장했습니다.', 'success', 2000);
  };

  const handleLoadHistory = (record: Calculator24Record) => {
    setValues({
      startDate: record.startDate, startTime: record.startTime, startExp: record.startExp,
      endDate: record.endDate, endTime: record.endTime, endExp: record.endExp,
      maintenanceEnabled: record.maintenanceEnabled, maintenanceHours: record.maintenanceHours,
      currentLevel: record.currentLevel, targetExp: 100, targetDate: record.targetDate ?? '',
    });
    showToast('계산 기록을 불러왔습니다.', 'success');
  };

  return (
    <div id="page-calculator">
      <PageHeader title="📅 24시간 계산기" subtitle="현재 사냥 속도를 기준으로 레벨업 예상 시점과 목표 달성 가능 여부를 계산합니다." />

      <Section title="">
        <InputPanel values={values} onChange={patch} onSave={handleSave} />
      </Section>

      <ColorSection dot="bg-primary" title="실시간 계산 결과">
        <RealtimeResult core={core} />
      </ColorSection>

      <ColorSection dot="bg-success" title="레벨업 예측">
        <LevelUpCard form={values} core={core} levelUp={levelUp} />
      </ColorSection>

      <ColorSection dot="bg-warning" title="목표 날짜 계산">
        <GoalCard targetDate={values.targetDate} onTargetDateChange={(v) => patch({ targetDate: v })} hasCore={core !== null} goal={goal} />
      </ColorSection>

      <ColorSection dot="bg-purple" title="시뮬레이션">
        <SimulationCard core={core} levelUp={levelUp} />
      </ColorSection>

      <ColorSection dot="bg-text-faint" title="최근 계산 기록">
        <HistoryList records={data.calculator24Records} onLoad={handleLoadHistory} onDelete={deleteCalcRecord} />
      </ColorSection>
    </div>
  );
}

function ColorSection({ dot, title, children }: { dot: string; title: string; children: ReactNode }) {
  return (
    <Section title="">
      <div className="mb-3.5 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[15px] font-bold">{title}</span>
      </div>
      {children}
    </Section>
  );
}

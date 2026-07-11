import type { ReactNode } from 'react';
import type { CalculatorFormValues } from '@/types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface InputPanelProps {
  values: CalculatorFormValues;
  onChange: (patch: Partial<CalculatorFormValues>) => void;
  onSave: () => void;
}

export function InputPanel({ values, onChange, onSave }: InputPanelProps) {
  return (
    <Card>
      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <div className="rounded-card border border-border/[0.08] bg-white/[0.03] p-5 border-t-[3px] border-t-primary">
          <div className="mb-3.5 text-[15px] font-semibold">시작 정보</div>
          <Field label="시작 날짜"><Input type="date" value={values.startDate} onChange={(e) => onChange({ startDate: e.target.value })} /></Field>
          <Field label="시작 시간"><Input type="time" value={values.startTime} onChange={(e) => onChange({ startTime: e.target.value })} /></Field>
          <Field label="시작 경험치 (%)"><Input type="number" step={0.0001} value={values.startExp} placeholder="예: 33.1245" onChange={(e) => onChange({ startExp: e.target.value === '' ? '' : Number(e.target.value) })} /></Field>
          <Field label="현재 레벨" last><Input value={values.currentLevel} placeholder="예: 87" onChange={(e) => onChange({ currentLevel: e.target.value })} /></Field>
        </div>

        <div className="rounded-card border border-border/[0.08] bg-white/[0.03] p-5 border-t-[3px] border-t-success">
          <div className="mb-3.5 text-[15px] font-semibold">종료 정보</div>
          <Field label="종료 날짜"><Input type="date" value={values.endDate} onChange={(e) => onChange({ endDate: e.target.value })} /></Field>
          <Field label="종료 시간"><Input type="time" value={values.endTime} onChange={(e) => onChange({ endTime: e.target.value })} /></Field>
          <Field label="종료 경험치 (%)"><Input type="number" step={0.0001} value={values.endExp} placeholder="예: 44.2871" onChange={(e) => onChange({ endExp: e.target.value === '' ? '' : Number(e.target.value) })} /></Field>
          <Field label="목표 레벨" last><Input value="" placeholder="예: 80 (참고용)" disabled /></Field>
        </div>
      </div>

      <div className="my-5 h-px bg-border/[0.08]" />

      <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="!text-sm !text-text">점검시간 제외</Label>
            <Switch checked={values.maintenanceEnabled} onCheckedChange={(v) => onChange({ maintenanceEnabled: v })} aria-label="점검시간 제외" />
          </div>
          <Input type="number" min={0} step={0.5} value={values.maintenanceHours} placeholder="점검시간(시간)" disabled={!values.maintenanceEnabled} onChange={(e) => onChange({ maintenanceHours: Number(e.target.value) || 0 })} />
        </div>
        <Field label="목표 레벨 필요 총 경험치 (%, 기본 100)">
          <Input type="number" step={0.0001} min={0} value={values.targetExp} onChange={(e) => onChange({ targetExp: e.target.value === '' ? '' : Number(e.target.value) })} />
        </Field>
        <Field label="목표 날짜">
          <Input type="date" value={values.targetDate} onChange={(e) => onChange({ targetDate: e.target.value })} />
        </Field>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={onSave}>
          <Save size={18} />
          이 계산 저장
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={last ? '' : 'mb-3.5'}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
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
  // "종료 레벨"은 계산식에 쓰이지 않는 참고용 표시 값이라(시작 쪽 "현재 레벨"과 동일하게 계산에
  // 관여하지 않음) 기존 JSON 구조(CalculatorFormValues/Calculator24Record)를 건드리지 않기 위해
  // 이 화면 안에서만 쓰이는 참고용 로컬 상태로 둔다. 실제 계산/저장 값은 전혀 바뀌지 않는다.
  const [endLevel, setEndLevel] = useState('');

  return (
    <Card>
      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <div className="rounded-card border border-border/[0.08] bg-white/[0.03] p-5 border-t-[3px] border-t-primary">
          <div className="mb-3.5 text-[15px] font-semibold">시작 정보</div>
          <Field label="시작 날짜"><Input type="date" value={values.startDate} onChange={(e) => onChange({ startDate: e.target.value })} /></Field>
          <Field label="시작 시간"><Input type="time" value={values.startTime} onChange={(e) => onChange({ startTime: e.target.value })} /></Field>
          <div className="mb-3.5 grid grid-cols-[64px_minmax(0,1fr)] gap-2">
            <Field label="시작 레벨">
              <Input value={values.currentLevel} placeholder="87" onChange={(e) => onChange({ currentLevel: e.target.value })} className="px-2 text-center" />
            </Field>
            <Field label="시작 경험치 (%)">
              <ExpMaskedInput value={values.startExp} onChange={(v) => onChange({ startExp: v })} />
            </Field>
          </div>
        </div>

        <div className="rounded-card border border-border/[0.08] bg-white/[0.03] p-5 border-t-[3px] border-t-success">
          <div className="mb-3.5 text-[15px] font-semibold">종료 정보</div>
          <Field label="종료 날짜"><Input type="date" value={values.endDate} onChange={(e) => onChange({ endDate: e.target.value })} /></Field>
          <Field label="종료 시간"><Input type="time" value={values.endTime} onChange={(e) => onChange({ endTime: e.target.value })} /></Field>
          <div className="mb-3.5 grid grid-cols-[64px_minmax(0,1fr)] gap-2">
            <Field label="종료 레벨">
              <Input value={endLevel} placeholder="87" onChange={(e) => setEndLevel(e.target.value)} className="px-2 text-center" />
            </Field>
            <Field label="종료 경험치 (%)">
              <ExpMaskedInput value={values.endExp} onChange={(v) => onChange({ endExp: v })} />
            </Field>
          </div>
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

/** "00.0001"처럼 정수부 2자리(0패딩) + 소수부 4자리로 표시 문자열을 만든다. */
function formatExpDigits(digits: string): string {
  if (digits === '') return '';
  const padded = digits.padStart(5, '0');
  const frac = padded.slice(-4);
  const intPart = padded.slice(0, -4).padStart(2, '0');
  return `${intPart}.${frac}`;
}

/**
 * 경험치 전용 숫자 마스킹 입력 (경험치 기록 화면의 것과 동일한 UX).
 * 숫자만(최대 6자리) 입력하면 자동으로 소수점 4자리를 넣어 보여준다. 예: "152424" → "15.2424".
 * onChange에 전달되는 값은 기존과 동일한 퍼센트 숫자이므로 계산 로직/저장 구조는 바뀌지 않는다.
 */
function ExpMaskedInput({ value, onChange }: { value: number | ''; onChange: (v: number | '') => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawDigits, setRawDigits] = useState(() => (value === '' ? '' : String(Math.round(value * 10000))));

  useEffect(() => {
    const asValue = rawDigits === '' ? '' : parseInt(rawDigits, 10) / 10000;
    if (value !== asValue) {
      setRawDigits(value === '' ? '' : String(Math.round((value as number) * 10000)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const display = formatExpDigits(rawDigits);

  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [display]);

  const commit = (nextDigits: string) => {
    setRawDigits(nextDigits);
    onChange(nextDigits === '' ? '' : parseInt(nextDigits, 10) / 10000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      if (rawDigits.length < 6) commit(rawDigits + e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      commit(rawDigits.slice(0, -1));
    } else if (e.key === 'Delete') {
      e.preventDefault();
      commit('');
    }
  };

  const handlePasteOrOther = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    commit(digits);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={display}
      placeholder="예: 152424 → 15.2424"
      onKeyDown={handleKeyDown}
      onChange={(e) => handlePasteOrOther(e.target.value)}
      className="font-display text-lg font-bold tracking-tight"
    />
  );
}

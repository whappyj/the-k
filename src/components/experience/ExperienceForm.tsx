import { useState, useRef, useEffect } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { Save, ScanText } from 'lucide-react';
import type { ExperienceFormValues } from '@/types';
import { MAX_PARTY } from '@/constants';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ExpOcrPanel } from '@/components/experience/ExpOcrPanel';
import type { ExpOcrResult } from '@/lib/ocrExp';
import { toDateTimeLocalValue, splitDateTimeLocalValue } from '@/utils/date';
import { cn } from '@/utils/cn';

interface ExperienceFormProps {
  values: ExperienceFormValues;
  onChange: (patch: Partial<ExperienceFormValues>) => void;
  huntAreaOptions: string[];
  isEditing: boolean;
  onSave: () => void;
  onReset: () => void;
  onCancelEdit: () => void;
}

export function ExperienceForm({ values, onChange, huntAreaOptions, isEditing, onSave, onReset, onCancelEdit }: ExperienceFormProps) {
  const [ocrTarget, setOcrTarget] = useState<'start' | 'end' | null>(null);
  const partySum = values.knight + values.elf + values.wizard;
  const partyOver = partySum > MAX_PARTY;
  const bibigiOver = values.bibigiEnabled && values.bibigiCount > partySum;

  const onEnterSave = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      onSave();
    }
  };

  const handleOcrResult = (target: 'start' | 'end', result: ExpOcrResult) => {
    if (result.reading.value === null) return; // ExpOcrPanel이 이미 실패 토스트를 띄웠으므로 여기서는 필드만 비워둔다
    const expPatch = target === 'start' ? { startExp: result.reading.value } : { endExp: result.reading.value };
    // 레벨이 함께 감지됐으면 자동으로 채운다(시작쪽 OCR이면 시작레벨, 종료쪽 OCR이면 종료레벨).
    // 못 찾았으면 기존 입력값을 그대로 두어 수동 입력이 가능하게 한다.
    const levelPatch = result.detectedLevel !== null ? (target === 'start' ? { startLevel: result.detectedLevel } : { endLevel: result.detectedLevel }) : {};
    onChange({ ...expPatch, ...levelPatch });
    setOcrTarget(null);
  };

  return (
    <Card onKeyDown={onEnterSave}>
      <FormSection title="1. 사냥 정보">
        <div className="mb-3.5 flex flex-col gap-1.5">
          <Label>사냥터</Label>
          <Input list="hunt-area-list" value={values.huntArea} placeholder="사냥터를 입력하거나 선택하세요" onChange={(e) => onChange({ huntArea: e.target.value })} />
          <datalist id="hunt-area-list">
            {huntAreaOptions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="시작 일시">
            <Input
              type="datetime-local"
              value={toDateTimeLocalValue(values.startDate, values.startTime)}
              onChange={(e) => {
                const { date, time } = splitDateTimeLocalValue(e.target.value);
                onChange({ startDate: date, startTime: time });
              }}
            />
          </Field>
          <Field label="종료 일시">
            <Input
              type="datetime-local"
              value={toDateTimeLocalValue(values.endDate, values.endTime)}
              onChange={(e) => {
                const { date, time } = splitDateTimeLocalValue(e.target.value);
                onChange({ endDate: date, endTime: time });
              }}
            />
          </Field>
        </div>
        <div className="mt-3.5">
          <Field label="마을 체류(엠탐) 시간 (분)">
            <Input type="number" min={0} step={1} value={values.townMinutes} placeholder="0" onChange={(e) => onChange({ townMinutes: Number(e.target.value) || 0 })} />
          </Field>
          <div className="mt-1 text-[11px] text-text-faint">실제 사냥시간 계산 시 전체 경과시간에서 이 시간만큼 제외됩니다.</div>
        </div>
      </FormSection>

      <FormSection title="2. 경험치 (%, 숫자만 입력하면 자동으로 소수점 4자리가 표시됩니다)">
        <div className="grid grid-cols-2 gap-3.5 max-[480px]:grid-cols-1">
          <div>
            <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
              <Field label="시작 레벨">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={values.startLevel}
                  placeholder="81"
                  onChange={(e) => onChange({ startLevel: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="px-2 text-center"
                />
              </Field>
              <Field label="시작 경험치 (%)">
                <ExpMaskedInput value={values.startExp} onChange={(v) => onChange({ startExp: v })} />
              </Field>
            </div>
            <Button variant="ghost" size="sm" className="mt-1.5" onClick={() => setOcrTarget(ocrTarget === 'start' ? null : 'start')}>
              <ScanText size={14} />
              스크린샷으로 채우기
            </Button>
          </div>
          <div>
            <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
              <Field label="종료 레벨">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={values.endLevel}
                  placeholder="81"
                  onChange={(e) => onChange({ endLevel: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="px-2 text-center"
                />
              </Field>
              <Field label="종료 경험치 (%)">
                <ExpMaskedInput value={values.endExp} onChange={(v) => onChange({ endExp: v })} />
              </Field>
            </div>
            <Button variant="ghost" size="sm" className="mt-1.5" onClick={() => setOcrTarget(ocrTarget === 'end' ? null : 'end')}>
              <ScanText size={14} />
              스크린샷으로 채우기
            </Button>
          </div>
        </div>
        <div className="mt-1.5 text-[11px] text-text-faint">레벨업이 있었다면 종료 레벨을 올려주세요 — 획득 경험치가 자동으로 (레벨차×100 + 종료% - 시작%)로 계산됩니다.</div>
        {ocrTarget && (
          <div className="mt-3.5 rounded-2xl border border-border/[0.08] bg-white/[0.03] p-4">
            <ExpOcrPanel onRecognized={(result) => handleOcrResult(ocrTarget, result)} />
          </div>
        )}
      </FormSection>

      <FormSection title="3. 파티 구성 (최대 8명)">
        <div className="grid grid-cols-3 gap-3">
          <PartyInput label="기사" value={values.knight} onChange={(v) => onChange({ knight: v })} />
          <PartyInput label="요정" value={values.elf} onChange={(v) => onChange({ elf: v })} />
          <PartyInput label="법사" value={values.wizard} onChange={(v) => onChange({ wizard: v })} />
        </div>
        <div className="mt-2.5 flex justify-between text-xs text-text-sub">
          <span>총 파티 인원</span>
          <span className={cn(partyOver && 'font-bold text-danger')}>{partySum} / {MAX_PARTY}명</span>
        </div>
      </FormSection>

      <FormSection title="4. 비비기">
        <div className="flex items-center justify-between">
          <Label className="!text-sm !text-text">비비기 사용</Label>
          <Switch checked={values.bibigiEnabled} onCheckedChange={(v) => onChange({ bibigiEnabled: v })} aria-label="비비기 사용" />
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <Label>비비기 인원</Label>
          <Input type="number" min={0} max={8} value={values.bibigiCount} disabled={!values.bibigiEnabled} onChange={(e) => onChange({ bibigiCount: Number(e.target.value) || 0 })} />
        </div>
        {bibigiOver && <div className="mt-1.5 text-xs text-danger">비비기 인원이 파티 인원보다 많습니다.</div>}
      </FormSection>

      <FormSection title="5. 몰이">
        <div className="flex items-center justify-between">
          <Label className="!text-sm !text-text">몰이 사용</Label>
          <Switch checked={values.molly} onCheckedChange={(v) => onChange({ molly: v })} aria-label="몰이 사용" />
        </div>
      </FormSection>

      <FormSection title="6. 메모">
        <Textarea maxLength={300} value={values.memo} placeholder="특이사항을 기록하세요 (선택, 최대 300자)" onChange={(e) => onChange({ memo: e.target.value.slice(0, 300) })} />
        <div className="mt-1 text-right text-[11px] text-text-faint">{values.memo.length} / 300</div>
      </FormSection>

      <div className="flex justify-end gap-2">
        {isEditing && (
          <Button variant="ghost" onClick={onCancelEdit}>
            수정 취소
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          초기화
        </Button>
        <Button variant="primary" onClick={onSave}>
          <Save size={18} />
          {isEditing ? '수정 완료' : '기록 저장'}
        </Button>
      </div>
    </Card>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 text-[13px] font-bold text-text-sub">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PartyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <Label className="mb-1.5 block">{label}</Label>
      <Input type="number" min={0} max={8} value={value} onChange={(e) => onChange(Math.max(0, Math.min(8, Number(e.target.value) || 0)))} />
    </div>
  );
}

/**
 * 경험치 전용 숫자 마스킹 입력.
 * 사용자는 숫자만(최대 6자리) 입력하고, 오른쪽에서 4자리 앞에 소수점을 자동으로 넣어 보여준다.
 * 예: "152424" 입력 → "15.2424" 표시. 실제로 onChange에 전달되는 값은 기존과 동일한
 * 퍼센트 숫자(예: 15.2424)이므로 계산 로직/저장 구조는 전혀 바뀌지 않는다.
 */
/** "00.0001"처럼 정수부 2자리(0패딩) + 소수부 4자리로 표시 문자열을 만든다. */
function formatExpDigits(digits: string): string {
  if (digits === '') return '';
  const padded = digits.padStart(5, '0');
  const frac = padded.slice(-4);
  const intPart = padded.slice(0, -4).padStart(2, '0');
  return `${intPart}.${frac}`;
}

function ExpMaskedInput({ value, onChange }: { value: number | ''; onChange: (v: number | '') => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 실제 입력된 숫자만 담는 내부 상태. 화면 표시(0패딩된 "00.0001" 등)를 다시 파싱해서
  // 다음 입력을 계산하면 앞의 0들이 자릿수에 잘못 포함되는 문제가 생기므로,
  // 항상 이 "순수 숫자 문자열"을 단일 진실 소스로 사용한다.
  const [rawDigits, setRawDigits] = useState(() => (value === '' ? '' : String(Math.round(value * 10000))));

  // 상위(부모)에서 값이 외부적으로 바뀐 경우(OCR 자동 채우기, 다른 기록 불러오기 등)만 동기화한다.
  useEffect(() => {
    const asValue = rawDigits === '' ? '' : parseInt(rawDigits, 10) / 10000;
    if (value !== asValue) {
      setRawDigits(value === '' ? '' : String(Math.round((value as number) * 10000)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const display = formatExpDigits(rawDigits);

  // 값이 바뀌어 화면 표시가 갱신된 뒤에도, 입력 중이라면 커서를 항상 맨 뒤에 유지한다.
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
    // 화살표, Tab 등 나머지 키는 그대로 통과시킨다.
  };

  const handlePasteOrOther = (raw: string) => {
    // 붙여넣기 등 keydown으로 처리되지 않은 입력에 대한 보조 처리 (숫자만 추출, 최대 6자리).
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

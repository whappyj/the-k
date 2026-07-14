import { useState, useRef, useEffect } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { Save, ScanText, Play, Square, User, Users, MapPin, FileText } from 'lucide-react';
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

/**
 * components/experience/ExperienceForm.tsx
 * "기록하기" 화면의 입력 영역 — 원본 시안대로 ①사냥설정 ②시작 ③종료 ④메모를 하나의 카드
 * 안에 순서대로 배치한다(카드를 여러 개로 쪼개지 않는다). "단독사냥/파티사냥" 큰 탭은
 * 로컬 UI 상태일 뿐 저장되는 데이터 구조를 바꾸지 않는다 — 단독사냥을 고르면 파티 관련
 * 입력을 화면에서 숨길 뿐, 기존 knight/elf/wizard 값은 그대로 유지되어 다시 파티사냥으로
 * 돌아가도 값이 사라지지 않는다. 계산 로직/필드는 전부 기존 그대로다.
 */
export function ExperienceForm({ values, onChange, huntAreaOptions, isEditing, onSave, onReset, onCancelEdit }: ExperienceFormProps) {
  const [ocrTarget, setOcrTarget] = useState<'start' | 'end' | null>(null);
  const [startManual, setStartManual] = useState(false);
  const [endManual, setEndManual] = useState(false);
  const [mode, setMode] = useState<'solo' | 'party'>(() => (values.knight + values.elf + values.wizard > 0 ? 'party' : 'solo'));
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
    if (result.reading.value === null) return;
    const expPatch = target === 'start' ? { startExp: result.reading.value } : { endExp: result.reading.value };
    const levelPatch = result.detectedLevel !== null ? (target === 'start' ? { startLevel: result.detectedLevel } : { endLevel: result.detectedLevel }) : {};
    onChange({ ...expPatch, ...levelPatch });
    setOcrTarget(null);
  };

  const captureNow = (which: 'start' | 'end') => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    onChange(which === 'start' ? { startDate: date, startTime: time } : { endDate: date, endTime: time });
  };

  return (
    <Card onKeyDown={onEnterSave} className="flex flex-col">
      {/* ① 사냥 방식 */}
      <SectionHeader icon={MapPin} title="사냥 방식" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <ModeTab active={mode === 'solo'} icon={User} label="단독사냥" onClick={() => setMode('solo')} />
        <ModeTab active={mode === 'party'} icon={Users} label="파티사냥" onClick={() => setMode('party')} />
      </div>

      {/* ② 사냥터 */}
      <div className="mb-5 flex flex-col gap-1.5">
        <Label>사냥터</Label>
        <Input list="hunt-area-list" value={values.huntArea} placeholder="사냥터를 입력하거나 선택하세요" onChange={(e) => onChange({ huntArea: e.target.value })} />
        <datalist id="hunt-area-list">
          {huntAreaOptions.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>

      {/* ③ 파티일 경우에만: 파티구성/몰이/비비기 */}
      {mode === 'party' && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <PartyInput label="기사" value={values.knight} onChange={(v) => onChange({ knight: v })} />
            <PartyInput label="요정" value={values.elf} onChange={(v) => onChange({ elf: v })} />
            <PartyInput label="법사" value={values.wizard} onChange={(v) => onChange({ wizard: v })} />
          </div>
          <div className="mb-4 flex justify-between text-xs text-text-sub">
            <span>총 파티 인원</span>
            <span className={cn(partyOver && 'font-bold text-danger')}>
              {partySum} / {MAX_PARTY}명
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-[#1D2530] bg-white/[0.02] p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="!text-sm !text-text">몰이 사용</Label>
                <Switch checked={values.molly} onCheckedChange={(v) => onChange({ molly: v })} aria-label="몰이 사용" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="!text-sm !text-text">비비기 사용</Label>
                <Switch checked={values.bibigiEnabled} onCheckedChange={(v) => onChange({ bibigiEnabled: v })} aria-label="비비기 사용" />
              </div>
              <Input
                type="number"
                min={0}
                max={8}
                value={values.bibigiCount}
                disabled={!values.bibigiEnabled}
                placeholder="비비기 인원"
                onChange={(e) => onChange({ bibigiCount: Number(e.target.value) || 0 })}
              />
              {bibigiOver && <div className="mt-1.5 text-xs text-danger">비비기 인원이 파티 인원보다 많습니다.</div>}
            </div>
          </div>
        </>
      )}

      <div className="mb-6 flex flex-col gap-1.5">
        <Label>마을 체류(엠탐) 시간 (분)</Label>
        <Input type="number" min={0} step={1} value={values.townMinutes} placeholder="0" onChange={(e) => onChange({ townMinutes: Number(e.target.value) || 0 })} />
      </div>

      <Divider />

      {/* ② 시작 / ③ 종료 */}
      <div className="mb-2 grid grid-cols-2 gap-5 max-[720px]:grid-cols-1">
        <TimeSection
          title="시작"
          accent="green"
          icon={Play}
          date={values.startDate}
          time={values.startTime}
          manual={startManual}
          onToggleManual={setStartManual}
          onCapture={() => captureNow('start')}
          onManualChange={(date, time) => onChange({ startDate: date, startTime: time })}
          level={values.startLevel}
          onLevelChange={(v) => onChange({ startLevel: v })}
          expValue={values.startExp}
          onExpChange={(v) => onChange({ startExp: v })}
          ocrOpen={ocrTarget === 'start'}
          onToggleOcr={() => setOcrTarget(ocrTarget === 'start' ? null : 'start')}
          onOcrResult={(r) => handleOcrResult('start', r)}
        />
        <TimeSection
          title="종료"
          accent="red"
          icon={Square}
          date={values.endDate}
          time={values.endTime}
          manual={endManual}
          onToggleManual={setEndManual}
          onCapture={() => captureNow('end')}
          onManualChange={(date, time) => onChange({ endDate: date, endTime: time })}
          level={values.endLevel}
          onLevelChange={(v) => onChange({ endLevel: v })}
          expValue={values.endExp}
          onExpChange={(v) => onChange({ endExp: v })}
          ocrOpen={ocrTarget === 'end'}
          onToggleOcr={() => setOcrTarget(ocrTarget === 'end' ? null : 'end')}
          onOcrResult={(r) => handleOcrResult('end', r)}
        />
      </div>
      <div className="mb-6 text-[11px] text-text-faint">
        레벨업이 있었다면 종료 레벨을 올려주세요 — 획득 경험치가 자동으로 (레벨차×100 + 종료% - 시작%)로 계산됩니다.
      </div>

      <Divider />

      {/* ④ 메모 */}
      <SectionHeader icon={FileText} title="메모" />
      <Textarea maxLength={300} value={values.memo} placeholder="특이사항을 기록하세요 (최대 300자)" onChange={(e) => onChange({ memo: e.target.value.slice(0, 300) })} />
      <div className="mb-6 mt-1 text-right text-[11px] text-text-faint">{values.memo.length} / 300</div>

      {/* ⑥ 저장 */}
      <div className="flex justify-end gap-2">
        {isEditing && (
          <Button variant="ghost" onClick={onCancelEdit}>
            수정 취소
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          초기화
        </Button>
        <Button variant="gold" onClick={onSave}>
          <Save size={18} />
          {isEditing ? '수정 완료' : '기록 저장'}
        </Button>
      </div>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof MapPin; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-dim text-gold">
        <Icon size={15} />
      </span>
      <span className="text-[15px] font-bold text-white">{title}</span>
    </div>
  );
}

function Divider() {
  return <div className="mb-6 border-t border-[#1D2530]" />;
}

function ModeTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof User; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-16 items-center justify-center gap-2.5 rounded-xl border text-[15px] font-bold transition-all duration-200',
        active ? 'border-gold/50 bg-gold-dim text-gold' : 'border-[#1D2530] bg-white/[0.02] text-text-sub hover:bg-white/[0.04]'
      )}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

function TimeSection({
  title,
  accent,
  icon: Icon,
  date,
  time,
  manual,
  onToggleManual,
  onCapture,
  onManualChange,
  level,
  onLevelChange,
  expValue,
  onExpChange,
  ocrOpen,
  onToggleOcr,
  onOcrResult,
}: {
  title: string;
  accent: 'green' | 'red';
  icon: typeof Play;
  date: string;
  time: string;
  manual: boolean;
  onToggleManual: (v: boolean) => void;
  onCapture: () => void;
  onManualChange: (date: string, time: string) => void;
  level: number | '';
  onLevelChange: (v: number | '') => void;
  expValue: number | '';
  onExpChange: (v: number | '') => void;
  ocrOpen: boolean;
  onToggleOcr: () => void;
  onOcrResult: (r: ExpOcrResult) => void;
}) {
  const hasTime = Boolean(date && time);
  return (
    <div>
      <SectionHeader icon={Icon} title={title} />
      {!manual ? (
        <button
          type="button"
          onClick={onCapture}
          className={cn(
            'mb-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold transition-colors duration-150',
            accent === 'green' ? 'bg-success-dim text-success hover:bg-success/[0.22]' : 'bg-danger-dim text-danger hover:bg-danger/[0.22]'
          )}
        >
          <Icon size={16} />
          {hasTime ? `${date} ${time}` : `${title} 기록`}
        </button>
      ) : (
        <div className="mb-3">
          <Input
            type="datetime-local"
            value={toDateTimeLocalValue(date, time)}
            onChange={(e) => {
              const { date: d, time: t } = splitDateTimeLocalValue(e.target.value);
              onManualChange(d, t);
            }}
          />
        </div>
      )}

      <label className="mb-4 flex items-center gap-2 text-[11.5px] font-medium text-text-sub">
        <input type="checkbox" checked={manual} onChange={(e) => onToggleManual(e.target.checked)} className="h-3.5 w-3.5 accent-gold" />
        수동으로 수정
      </label>

      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
        <Field label="레벨">
          <Input type="number" min={1} step={1} value={level} placeholder="81" onChange={(e) => onLevelChange(e.target.value === '' ? '' : Number(e.target.value))} className="px-2 text-center" />
        </Field>
        <Field label="경험치 (%)">
          <ExpMaskedInput value={expValue} onChange={onExpChange} />
        </Field>
      </div>

      <Button variant="ghost" size="sm" className="mt-2" onClick={onToggleOcr}>
        <ScanText size={14} />
        스크린샷으로 채우기
      </Button>

      {ocrOpen && (
        <div className="mt-3 rounded-xl border border-[#1D2530] bg-white/[0.03] p-4">
          <ExpOcrPanel onRecognized={onOcrResult} />
        </div>
      )}
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

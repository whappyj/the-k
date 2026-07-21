import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Upload,
  Archive,
  Pencil,
} from 'lucide-react';

interface MaterialRow {
  name: string;
  qty: number;
  priceA: number;
  priceB: number;
}

interface EstimateItem {
  id: string;
  name: string;
  materials: MaterialRow[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  qtyTier: 1 | 3 | 5;
}

interface EstimateDataFile {
  version: string;
  items: EstimateItem[];
}

const EMPTY_FILE: EstimateDataFile = { version: '1.0.0', items: [] };

function makeId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyItem(name: string): EstimateItem {
  return { id: makeId(), name, materials: [], rateA: 900, rateB: 1000, feeA: 0, feeB: 0, qtyTier: 1 };
}

/** "1.0.0" -> "1.0.1" 처럼 패치 버전만 1 올린다. 형식이 예상과 다르면 그대로 둔다. */
function bumpVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 3) return version;
  const patch = Number(parts[2]);
  if (!Number.isFinite(patch)) return version;
  return `${parts[0]}.${parts[1]}.${patch + 1}`;
}

/**
 * yaki/EstimateDataEditor.tsx
 * "제작 비교 견적" 데이터(여러 제작 아이템 각각의 재료/기본 시세/환율/기본값)를
 * 버튼과 입력창만으로 수정하고, estimate-data.json 파일을 생성해 다운로드하는 화면.
 * 상단에서 아이템을 고르고, 고른 아이템의 재료/시세/환율만 아래에서 편집한다.
 */
export function EstimateDataEditor() {
  const [file, setFile] = useState<EstimateDataFile>(EMPTY_FILE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`./estimate-data.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : EMPTY_FILE))
      .then((json: EstimateDataFile) => {
        const next = { ...EMPTY_FILE, ...json };
        setFile(next);
        setSelectedId(next.items[0]?.id ?? null);
      })
      .catch(() => setFile(EMPTY_FILE))
      .finally(() => setLoaded(true));
  }, []);

  const selected = file.items.find((it) => it.id === selectedId) ?? null;

  const updateSelectedItem = (patch: Partial<EstimateItem>) => {
    if (!selectedId) return;
    setFile((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === selectedId ? { ...it, ...patch } : it)) }));
  };

  const updateMaterial = (index: number, patch: Partial<MaterialRow>) => {
    if (!selected) return;
    updateSelectedItem({ materials: selected.materials.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  };

  const addMaterial = () => {
    if (!selected) return;
    updateSelectedItem({ materials: [...selected.materials, { name: '', qty: 1, priceA: 0, priceB: 0 }] });
  };

  const deleteMaterial = (index: number) => {
    if (!selected) return;
    updateSelectedItem({ materials: selected.materials.filter((_, i) => i !== index) });
  };

  const moveMaterial = (index: number, dir: -1 | 1) => {
    if (!selected) return;
    const next = [...selected.materials];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    updateSelectedItem({ materials: next });
  };

  // --- 견적 아이템(제작템) 관리 ---
  const addItem = () => {
    const item = emptyItem(`새 아이템 ${file.items.length + 1}`);
    setFile((prev) => ({ ...prev, items: [...prev.items, item] }));
    setSelectedId(item.id);
  };

  const deleteItem = (id: string) => {
    setFile((prev) => {
      const items = prev.items.filter((it) => it.id !== id);
      return { ...prev, items };
    });
    if (selectedId === id) {
      const remaining = file.items.filter((it) => it.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const duplicateItem = (id: string) => {
    const src = file.items.find((it) => it.id === id);
    if (!src) return;
    const copy: EstimateItem = { ...src, id: makeId(), name: `${src.name} 사본`, materials: src.materials.map((m) => ({ ...m })) };
    setFile((prev) => {
      const idx = prev.items.findIndex((it) => it.id === id);
      const items = [...prev.items];
      items.splice(idx + 1, 0, copy);
      return { ...prev, items };
    });
    setSelectedId(copy.id);
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setFile((prev) => {
      const idx = prev.items.findIndex((it) => it.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.items.length) return prev;
      const items = [...prev.items];
      const a = items[idx];
      const b = items[target];
      if (!a || !b) return prev;
      items[idx] = b;
      items[target] = a;
      return { ...prev, items };
    });
  };

  const renameItem = (id: string, name: string) => {
    setFile((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, name } : it)) }));
  };

  // --- 저장 / 백업 / 가져오기 ---
  const downloadJson = (payload: EstimateDataFile, filename: string) => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveClick = () => setConfirmOpen(true);

  const handleConfirmSave = () => {
    setConfirmOpen(false);
    const nextVersion = bumpVersion(file.version);
    const nextFile = { ...file, version: nextVersion };
    setFile(nextFile);
    downloadJson(nextFile, 'estimate-data.json');
    setDoneMessage(`estimate-data.json 다운로드 완료! (버전 ${file.version} → ${nextVersion})`);
    window.setTimeout(() => setDoneMessage(null), 5000);
  };

  const handleBackup = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadJson(file, `estimate-data-backup-${stamp}.json`);
    setDoneMessage('현재 상태를 백업 파일로 다운로드했습니다.');
    window.setTimeout(() => setDoneMessage(null), 4000);
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleImportFile = (fileList: FileList | null) => {
    const f = fileList?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as EstimateDataFile;
        if (!parsed || !Array.isArray(parsed.items)) throw new Error('items 배열이 없습니다.');
        setFile({ version: parsed.version ?? '1.0.0', items: parsed.items });
        setSelectedId(parsed.items[0]?.id ?? null);
        setDoneMessage('JSON 파일을 불러왔습니다. 확인 후 저장을 눌러주세요.');
        window.setTimeout(() => setDoneMessage(null), 4000);
      } catch (err) {
        window.alert(`JSON을 읽을 수 없습니다: ${String(err)}`);
      }
    };
    reader.readAsText(f);
  };

  if (!loaded) {
    return <div className="p-8 text-center text-[14px] text-text-sub">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 p-4 pb-28 min-[640px]:p-6">
      <header className="pt-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[22px] font-bold text-white">⚙ 제작 견적 데이터 관리</h1>
          <span className="shrink-0 rounded-full bg-primary-dim px-3 py-1 text-[12px] font-bold text-primary">v{file.version}</span>
        </div>
        <p className="mt-2 text-[13px] text-text-sub">
          저장하면 <b className="text-primary">estimate-data.json</b> 파일이 다운로드됩니다. 이 파일로 저장소의 같은 파일을 교체하고 Commit하면 배포됩니다.
        </p>
      </header>

      <Section title="견적 아이템" action={<SmallActionButton icon={Plus} label="아이템 추가" onClick={addItem} />}>
        {file.items.length === 0 && <div className="py-6 text-center text-[13px] text-text-faint">아이템이 없습니다. "아이템 추가"를 눌러주세요.</div>}
        <div className="flex flex-col gap-2.5">
          {file.items.map((it, i) => (
            <div
              key={it.id}
              className={`rounded-2xl border p-3.5 transition-colors ${
                it.id === selectedId ? 'border-primary/50 bg-primary-dim' : 'border-[#1D2530] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setSelectedId(it.id)} className="min-w-0 flex-1 text-left">
                  {renamingId === it.id ? (
                    <input
                      autoFocus
                      value={it.name}
                      onChange={(e) => renameItem(it.id, e.target.value)}
                      onBlur={() => setRenamingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setRenamingId(null)}
                      className="h-9 w-full rounded-lg border border-primary/40 bg-white/[0.06] px-2.5 text-[14px] font-bold text-white outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`truncate text-[14px] font-bold ${it.id === selectedId ? 'text-primary' : 'text-white'}`}>{it.name || '(이름 없음)'}</span>
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] text-text-faint">재료 {it.materials.length}개</div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon={Pencil} onClick={() => setRenamingId(it.id)} label="이름 변경" />
                  <IconButton icon={ChevronUp} onClick={() => moveItem(it.id, -1)} disabled={i === 0} label="위로" />
                  <IconButton icon={ChevronDown} onClick={() => moveItem(it.id, 1)} disabled={i === file.items.length - 1} label="아래로" />
                  <IconButton icon={Copy} onClick={() => duplicateItem(it.id)} label="복사" />
                  <IconButton icon={Trash2} tone="danger" onClick={() => deleteItem(it.id)} label="삭제" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {selected ? (
        <>
          <Section title={`"${selected.name}" 재료 목록`} action={<SmallActionButton icon={Plus} label="재료 추가" onClick={addMaterial} />}>
            {selected.materials.length === 0 && <div className="py-6 text-center text-[13px] text-text-faint">재료가 없습니다. "재료 추가"를 눌러주세요.</div>}
            <div className="flex flex-col gap-3">
              {selected.materials.map((m, i) => (
                <div key={i} className="rounded-2xl border border-[#1D2530] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="shrink-0 text-[11px] font-bold text-text-faint">#{i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <IconButton icon={ChevronUp} onClick={() => moveMaterial(i, -1)} disabled={i === 0} label="위로" />
                      <IconButton icon={ChevronDown} onClick={() => moveMaterial(i, 1)} disabled={i === selected.materials.length - 1} label="아래로" />
                      <IconButton icon={Trash2} tone="danger" onClick={() => deleteMaterial(i)} label="삭제" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <Field label="재료 이름">
                      <BigInput type="text" value={m.name} onChange={(v) => updateMaterial(i, { name: v })} placeholder="재료 이름" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <Field label="필요 수량">
                      <BigInput type="number" value={String(m.qty)} onChange={(v) => updateMaterial(i, { qty: Number(v) || 0 })} />
                    </Field>
                    <Field label="기본 단가 A">
                      <BigInput type="number" value={String(m.priceA)} onChange={(v) => updateMaterial(i, { priceA: Number(v) || 0 })} />
                    </Field>
                    <Field label="기본 단가 B">
                      <BigInput type="number" value={String(m.priceB)} onChange={(v) => updateMaterial(i, { priceB: Number(v) || 0 })} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="기본 환율">
            <div className="grid grid-cols-2 gap-3">
              <Field label="환율 A">
                <BigInput type="number" value={String(selected.rateA)} onChange={(v) => updateSelectedItem({ rateA: Number(v) || 0 })} />
              </Field>
              <Field label="환율 B">
                <BigInput type="number" value={String(selected.rateB)} onChange={(v) => updateSelectedItem({ rateB: Number(v) || 0 })} />
              </Field>
            </div>
          </Section>

          <Section title="제작 수수료">
            <div className="grid grid-cols-2 gap-3">
              <Field label="수수료 A">
                <BigInput type="number" value={String(selected.feeA)} onChange={(v) => updateSelectedItem({ feeA: Number(v) || 0 })} />
              </Field>
              <Field label="수수료 B">
                <BigInput type="number" value={String(selected.feeB)} onChange={(v) => updateSelectedItem({ feeB: Number(v) || 0 })} />
              </Field>
            </div>
          </Section>

          <Section title="기본 제작 수량">
            <div className="grid grid-cols-3 gap-2.5">
              {([1, 3, 5] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => updateSelectedItem({ qtyTier: tier })}
                  className={`h-14 rounded-2xl border text-[16px] font-bold transition-all duration-200 ${
                    selected.qtyTier === tier ? 'border-primary/50 bg-primary-dim text-primary' : 'border-[#1D2530] bg-white/[0.02] text-text-sub'
                  }`}
                >
                  {tier}개
                </button>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <div className="rounded-2xl border border-[#1D2530] bg-[#0B1016] p-8 text-center text-[13px] text-text-faint">
          위에서 견적 아이템을 선택하거나 추가하면 재료·시세·환율을 편집할 수 있습니다.
        </div>
      )}

      <Section title="백업 / 가져오기">
        <div className="grid grid-cols-2 gap-3">
          <SmallActionButton icon={Archive} label="현재 JSON 백업" onClick={handleBackup} full />
          <SmallActionButton icon={Upload} label="JSON 가져오기" onClick={handleImportClick} full />
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            handleImportFile(e.target.files);
            e.target.value = '';
          }}
        />
      </Section>

      {doneMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success-dim px-5 py-4 text-[14px] font-semibold text-success">
          <CheckCircle2 size={20} />
          {doneMessage}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-[#1D2530] bg-[#06080B]/95 p-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSaveClick}
          className="mx-auto flex h-16 w-full max-w-[720px] items-center justify-center gap-2.5 rounded-2xl bg-primary text-[18px] font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:shadow-lg active:scale-[0.98]"
        >
          <Save size={22} />
          저장 (estimate-data.json 생성)
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-5">
          <div className="w-full max-w-[380px] rounded-2xl border border-[#1D2530] bg-[#0B1016] p-7">
            <div className="mb-4 flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dim text-primary">
                <AlertTriangle size={24} />
              </span>
              <div>
                <div className="text-[16px] font-bold text-white">저장하시겠습니까?</div>
                <div className="mt-1 text-[13px] text-text-sub">
                  견적 아이템 {file.items.length}개가 estimate-data.json으로 저장됩니다.
                  <br />
                  버전이 {file.version} → {bumpVersion(file.version)}(으)로 올라갑니다.
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setConfirmOpen(false)} className="h-[52px] flex-1 rounded-xl border border-[#1D2530] bg-white/[0.02] py-3.5 text-[15px] font-semibold text-text-sub">
                취소
              </button>
              <button type="button" onClick={handleConfirmSave} className="h-[52px] flex-1 rounded-xl bg-primary py-3.5 text-[15px] font-bold text-white">
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#1D2530] bg-[#0B1016] p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-text-sub">{label}</label>
      {children}
    </div>
  );
}

function BigInput({ type, value, onChange, placeholder }: { type: 'text' | 'number'; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type={type}
      inputMode={type === 'number' ? 'decimal' : 'text'}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-[52px] w-full rounded-xl border border-border/[0.12] bg-white/[0.04] px-4 text-[15px] text-text outline-none focus:border-primary"
    />
  );
}

function SmallActionButton({ icon: Icon, label, onClick, full }: { icon: typeof Plus; label: string; onClick: () => void; full?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-dim px-4 text-[13px] font-bold text-primary ${full ? 'w-full' : ''}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function IconButton({ icon: Icon, onClick, disabled, tone, label }: { icon: typeof Trash2; onClick: () => void; disabled?: boolean; tone?: 'danger'; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1D2530] transition-opacity ${
        disabled ? 'opacity-30' : tone === 'danger' ? 'text-danger' : 'text-text-sub'
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

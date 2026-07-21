import { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadJSON, validateImportPayload, parseImportPayload, readJsonFile } from '@/lib/export';

export function DataManagement() {
  const { data } = useAppData();
  const { importMerge, resetAll } = useAppDataActions();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const counts = [
    { label: '제작 견적 프리셋', value: data.estimate.presets.length },
    { label: '경험치 기록', value: data.experienceRecords.length },
    { label: '24시간 계산기 기록', value: data.calculator24Records.length },
    { label: '즐겨찾기 파티', value: data.favoriteParties.length },
    { label: '아이템 DB', value: data.items.length },
    { label: '아데나 매입 기록', value: data.purchaseRecords.length },
  ];

  const handleImportFile = async (file: File) => {
    try {
      const json = await readJsonFile(file);
      const error = validateImportPayload(json);
      if (error) return showToast(error, 'danger');
      importMerge(parseImportPayload(json));
      showToast('백업 파일(.thek)을 가져와 병합했습니다. (제작견적/경험치/계산기/즐겨찾기/아이템/아데나매입 전체 포함)', 'success', 2500);
    } catch {
      showToast('.thek 파일 형식이 올바르지 않아 가져올 수 없습니다.', 'danger');
    }
  };

  const handleResetAll = async () => {
    if (await confirm('모든 데이터를 삭제하시겠습니까?')) {
      resetAll();
      showToast('모든 데이터를 삭제했습니다.', 'success');
    }
  };

  return (
    <Card className="p-8">
      <div className="mb-6 text-[16px] font-bold text-white">저장된 데이터 현황</div>
      <div className="mb-8 grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1">
        {counts.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/[0.08] bg-white/[0.03] p-6 text-center">
            <div className="mb-4 text-[12.5px] text-text-sub">{c.label}</div>
            <div className="font-display text-[28px] font-bold">{c.value}개</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-dim to-transparent p-8">
        <div className="mb-2.5 text-[15px] font-bold text-white">전체 백업 / 복원 (.thek)</div>
        <div className="mb-6 text-[13px] text-text-faint">
          위 6개 항목(제작견적/경험치/24시간계산기/즐겨찾기/아이템/아데나매입) + 설정을 통째로 담습니다. 다른 PC로 옮기거나 만약을 대비해 주기적으로 백업해두세요.
        </div>

        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => downloadJSON(data)}>
            <Download size={18} />
            전체 백업 (.thek)
          </Button>
          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            백업 파일 복원 (.thek)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".thek,.json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
          <Button variant="danger" onClick={handleResetAll}>
            <Trash2 size={18} />
            전체 데이터 삭제
          </Button>
        </div>
      </div>
    </Card>
  );
}

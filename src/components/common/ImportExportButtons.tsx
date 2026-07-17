import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportExportButtonsProps {
  /** 버튼에 표시할 라벨(예: "경험치"). 접근성 aria-label에도 쓰인다. */
  label: string;
  onExport: () => void;
  onImportFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * components/common/ImportExportButtons.tsx
 * 경험치/아데나매입/아이템비교/제작계산기/설정 화면이 전부 이 컴포넌트 하나를 공유해서
 * 내보내기(📤)/불러오기(📥) UI가 어디서나 동일하게 동작한다.
 */
export function ImportExportButtons({ label, onExport, onImportFile, disabled }: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onExport} disabled={disabled} aria-label={`${label} 내보내기`}>
        <Download size={16} />
        📤 내보내기
      </Button>
      <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} aria-label={`${label} 불러오기`}>
        <Upload size={16} />
        📥 불러오기
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".thek,.json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

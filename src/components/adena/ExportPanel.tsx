import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, FileJson, FileType, Copy, Download, Check } from 'lucide-react';
import type { PurchaseRecord, PurchaseSettings } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { buildTxtContent, exportAdenaExcel, exportAdenaCsv, exportAdenaTxt, exportAdenaJson } from '@/lib/adenaExport';
import { cn } from '@/utils/cn';

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  records: PurchaseRecord[];
  settings: PurchaseSettings;
}

type ExportFormat = 'xlsx' | 'txt' | 'csv' | 'json';

const FORMATS: { key: ExportFormat; icon: typeof FileSpreadsheet; label: string; desc: string }[] = [
  { key: 'xlsx', icon: FileSpreadsheet, label: 'Excel 파일 (.xlsx)', desc: 'Microsoft Excel 파일로 저장' },
  { key: 'txt', icon: FileText, label: '메모장 버전 (.txt)', desc: '리스트 형태의 텍스트 파일' },
  { key: 'csv', icon: FileType, label: 'CSV 파일 (.csv)', desc: 'CSV 형식으로 저장 (엑셀/구글시트 호환)' },
  { key: 'json', icon: FileJson, label: 'JSON 파일 (.json)', desc: '데이터 백업용 JSON 형식' },
];

/**
 * components/adena/ExportPanel.tsx ("내보내기")
 * Excel/TXT/CSV/JSON 4가지 형식 중 골라 내보낸다. TXT는 메모장 미리보기 + 복사가 가능하다.
 * 전부 src/lib/adenaExport.ts(순수 표시·포맷 전용)를 통해 만들어지며, 저장된 매입 기록을
 * 그대로 옮겨 적을 뿐 새 계산식은 없다.
 */
export function ExportPanel({ open, onClose, records, settings }: ExportPanelProps) {
  const { showToast } = useToast();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [copied, setCopied] = useState(false);

  const txtPreview = useMemo(() => buildTxtContent(records, settings), [records, settings]);

  const handleDownload = () => {
    if (format === 'xlsx') exportAdenaExcel(records, settings);
    else if (format === 'csv') exportAdenaCsv(records, settings);
    else if (format === 'txt') exportAdenaTxt(records, settings);
    else exportAdenaJson(records, settings);
    showToast('내보내기 파일을 다운로드했습니다.', 'success');
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(txtPreview);
      setCopied(true);
      showToast('미리보기 내용을 복사했습니다.', 'success', 2000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('복사에 실패했습니다.', 'danger');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="내보내기 (다양한 포맷 지원)">
      <div className="grid grid-cols-1 gap-6 min-[720px]:grid-cols-[280px_1fr]">
        <div>
          <div className="mb-2.5 text-[12px] font-bold text-text-sub">내보내기 항목 선택</div>
          <div className="flex flex-col gap-2.5">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFormat(f.key)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  format === f.key ? 'border-gold/50 bg-gold-dim' : 'border-[#1D2530] bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', format === f.key ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-text-sub')}>
                  <f.icon size={17} />
                </span>
                <span>
                  <div className={cn('text-[14px] font-bold', format === f.key ? 'text-gold' : 'text-white')}>{f.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-text-faint">{f.desc}</div>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[12px] font-bold text-text-sub">매모장 버전 (.txt) 미리보기</div>
          </div>
          <pre className="h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl border border-[#1D2530] bg-black/30 p-4 text-[11.5px] leading-relaxed text-text-sub">
            {txtPreview}
          </pre>
          <div className="mt-3 flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={handleCopyPreview}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              미리보기 복사
            </Button>
            <Button variant="gold" className="flex-1" onClick={handleDownload}>
              <Download size={16} />
              {format === 'xlsx' ? '다운로드 (.xlsx)' : format === 'csv' ? '다운로드 (.csv)' : format === 'json' ? '다운로드 (.json)' : '다운로드 (.txt)'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Upload, ScanText, Crop, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { recognizeSmart } from '@/lib/ocr';
import type { OcrRecognitionResult, OcrMode } from '@/lib/ocr';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageOcrPanelProps {
  onRecognized: (result: OcrRecognitionResult) => void;
  hint?: string;
  /** "전체 인식" 버튼을 눌렀을 때 사용할 페이지 세그멘테이션 모드. 드래그 선택 시에는 항상 'crop'을 쓴다. */
  fullMode?: Extract<OcrMode, 'full' | 'itemDetail'>;
  /** OCR 인식이 시작되는 시점에 호출된다 (소요시간 측정 등에 사용). */
  onStart?: () => void;
  /** 이미지가 로드된 시점(붙여넣기/업로드 직후)에 원본 이미지 URL과 함께 호출된다. */
  onImageLoaded?: (url: string) => void;
  /** 지정하면 전체 인식 후 이 패턴에 맞는 영역을 자동으로 찾아 한 번 더 정밀 인식한다 (ROI 자동 탐색). */
  roiPattern?: RegExp;
}

/**
 * 스크린샷을 업로드하거나 클립보드에서 붙여넣으면, 전체 또는 드래그로 선택한 영역만
 * OCR로 인식해 텍스트/신뢰도/처리시간을 돌려준다. 신뢰도가 낮으면 자동으로 여러 전처리
 * 조합을 추가로 시도한다 (recognizeSmart, 자동 튜닝).
 */
export function ImageOcrPanel({ onRecognized, hint, fullMode = 'full', onStart, onImageLoaded, roiPattern }: ImageOcrPanelProps) {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [recognizing, setRecognizing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // 언마운트 시 마지막으로 만든 오브젝트 URL을 반드시 해제한다 (메모리 누수 방지).
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadFile = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); // 이전 이미지 URL 해제 후 새로 발급
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
    setSelection(null);
    onImageLoaded?.(url);
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    let file: File | null = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      if (item.type.startsWith('image/')) {
        file = item.getAsFile();
        break;
      }
    }
    if (file) loadFile(file);
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelection(null);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!dragStart) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelection({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y),
    });
  };

  const handleMouseUp = () => setDragStart(null);

  /** 화면에 표시된 좌표(selection)를 이미지 원본 픽셀 좌표로 환산해 크롭한다. */
  const cropToCanvas = (): HTMLCanvasElement | null => {
    const img = imgRef.current;
    if (!img || !selection || selection.w < 8 || selection.h < 8) return null;

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const canvas = document.createElement('canvas');
    canvas.width = selection.w * scaleX;
    canvas.height = selection.h * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, selection.x * scaleX, selection.y * scaleY, selection.w * scaleX, selection.h * scaleY, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const runOcr = async (target: 'full' | 'selection') => {
    if (!imageUrl || !imgRef.current) return;
    setRecognizing(true);
    onStart?.();
    try {
      const source = target === 'selection' ? cropToCanvas() : imgRef.current;
      if (!source) {
        showToast('선택 영역이 너무 작습니다. 다시 드래그해주세요.', 'danger');
        return;
      }
      const mode: OcrMode = target === 'selection' ? 'crop' : fullMode;
      const { result, autoTuned, attempts } = await recognizeSmart(source, mode, 70, target === 'full' ? roiPattern : undefined);
      if (!result.text.trim()) {
        showToast('텍스트를 인식하지 못했습니다. 다른 영역이나 더 선명한 이미지로 시도해보세요.', 'danger');
        return;
      }
      onRecognized(result);
      const cacheNote = result.fromCache ? ' · 캐시 사용' : '';
      const tuneNote = autoTuned ? ` · 자동튜닝 ${attempts}회 시도` : '';
      showToast(`OCR 인식 완료 (신뢰도 ${Math.round(result.confidence)}%)${tuneNote}${cacheNote}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('OCR 인식에 실패했습니다.', 'danger');
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <div>
      {!imageUrl ? (
        <div
          onPaste={handlePaste}
          tabIndex={0}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/[0.14] bg-white/[0.02] px-6 py-10 text-center outline-none focus:border-primary"
        >
          <Upload className="h-6 w-6 text-text-faint" />
          <div className="text-[13px] text-text-sub">{hint ?? '스크린샷을 붙여넣거나(Ctrl+V) 파일을 선택하세요'}</div>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            파일 선택
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        <div>
          <div
            ref={containerRef}
            className="relative mb-3 inline-block max-w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-border/[0.08]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img ref={imgRef} src={imageUrl} alt="OCR 대상 스크린샷" className="block max-w-full" draggable={false} />
            {selection && (
              <div
                className="absolute border-2 border-primary bg-primary/20"
                style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" disabled={recognizing} onClick={() => runOcr('full')}>
              <ScanText size={16} />
              전체 인식
            </Button>
            <Button variant="secondary" size="sm" disabled={recognizing || !selection} onClick={() => runOcr('selection')}>
              <Crop size={16} />
              선택 영역만 인식
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setImageUrl(null);
                setSelection(null);
              }}
            >
              <X size={16} />
              다시 선택
            </Button>
            {recognizing && <span className="text-xs text-text-sub">인식 중입니다... (신뢰도가 낮으면 자동으로 재시도합니다)</span>}
          </div>
          <div className="mt-1.5 text-[11px] text-text-faint">이미지를 드래그하면 특정 영역(예: 레벨 부분)만 선택해서 인식할 수 있습니다.</div>
        </div>
      )}
    </div>
  );
}

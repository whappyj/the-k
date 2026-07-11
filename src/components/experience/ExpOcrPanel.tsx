import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Upload, ScanText, Crosshair, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { recognizeExpValue } from '@/lib/ocrExp';
import type { ExpOcrResult } from '@/lib/ocrExp';
import { getExpRoiCalibration, saveExpRoiCalibration, toRelativeRoi } from '@/lib/expRoiCalibration';
import type { RelativeRoi } from '@/lib/expRoiCalibration';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ExpOcrPanelProps {
  onRecognized: (result: ExpOcrResult) => void;
}

/**
 * 경험치 화면 스크린샷을 올리면, 처음 한 번만 위치를 보정(드래그로 영역 지정)해두고
 * 이후에는 같은 비율의 영역을 자동으로 잘라 숫자 전용 엔진으로 바로 인식한다.
 * 해상도/창 크기가 달라져도 상대좌표라 그대로 동작한다.
 */
export function ExpOcrPanel({ onRecognized }: ExpOcrPanelProps) {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<RelativeRoi | null>(() => getExpRoiCalibration());
  const [recalibrating, setRecalibrating] = useState(false);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [recognizing, setRecognizing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadFile = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
    setSelection(null);
    setRecalibrating(!calibration); // 보정된 게 없으면 바로 보정 모드로 시작
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    let file: File | null = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
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
    setSelection({ x: Math.min(dragStart.x, x), y: Math.min(dragStart.y, y), w: Math.abs(x - dragStart.x), h: Math.abs(y - dragStart.y) });
  };

  const handleMouseUp = () => setDragStart(null);

  const handleSaveCalibrationAndRecognize = async () => {
    const img = imgRef.current;
    if (!img || !selection || selection.w < 6 || selection.h < 6) {
      showToast('영역이 너무 작습니다. 경험치 숫자 부분을 다시 드래그해주세요.', 'danger');
      return;
    }
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const pxBox = { x: selection.x * scaleX, y: selection.y * scaleY, w: selection.w * scaleX, h: selection.h * scaleY };
    const relative = toRelativeRoi(pxBox, img.naturalWidth, img.naturalHeight);

    saveExpRoiCalibration(relative);
    setCalibration(relative);
    setRecalibrating(false);
    showToast('경험치 위치를 저장했습니다. 다음부터는 자동으로 이 영역을 인식합니다.', 'success');
    await runRecognition();
  };

  const runRecognition = async () => {
    if (!imageUrl) return;
    setRecognizing(true);
    try {
      const result = await recognizeExpValue(imgRef.current!);
      onRecognized(result);
      if (result.reading.value === null) {
        showToast(`경험치 숫자를 찾지 못했습니다 (신뢰도 ${Math.round(result.reading.confidence)}%). 직접 입력해주세요.`, 'danger');
      } else {
        const levelNote = result.detectedLevel !== null ? ` · 레벨 ${result.detectedLevel} 감지` : ' · 레벨은 인식 못함(직접 입력)';
        showToast(`경험치 ${result.reading.raw} 인식 완료 (신뢰도 ${Math.round(result.reading.confidence)}%)${levelNote}`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('OCR 인식에 실패했습니다.', 'danger');
    } finally {
      setRecognizing(false);
    }
  };

  if (!imageUrl) {
    return (
      <div
        onPaste={handlePaste}
        tabIndex={0}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/[0.14] bg-white/[0.02] px-6 py-10 text-center outline-none focus:border-primary"
      >
        <Upload className="h-6 w-6 text-text-faint" />
        <div className="text-[13px] text-text-sub">경험치 화면 스크린샷을 붙여넣거나(Ctrl+V) 파일을 선택하세요</div>
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
    );
  }

  const showCalibrationUi = recalibrating || !calibration;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative mb-3 inline-block max-w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-border/[0.08]"
        onMouseDown={showCalibrationUi ? handleMouseDown : undefined}
        onMouseMove={showCalibrationUi ? handleMouseMove : undefined}
        onMouseUp={showCalibrationUi ? handleMouseUp : undefined}
      >
        <img ref={imgRef} src={imageUrl} alt="경험치 스크린샷" className="block max-w-full" draggable={false} />
        {showCalibrationUi && selection && (
          <div className="absolute border-2 border-primary bg-primary/20" style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }} />
        )}
      </div>

      {showCalibrationUi ? (
        <>
          <div className="mb-2 text-[13px] text-text-sub">경험치 숫자가 표시되는 영역을 드래그로 선택하세요. (최초 1회만 하면 다음부터 자동으로 인식합니다)</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" disabled={!selection || recognizing} onClick={handleSaveCalibrationAndRecognize}>
              <Crosshair size={16} />
              이 위치로 저장하고 인식
            </Button>
            {calibration && (
              <Button variant="ghost" size="sm" onClick={() => setRecalibrating(false)}>
                <X size={16} />
                취소
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" disabled={recognizing} onClick={runRecognition}>
            <ScanText size={16} />
            {recognizing ? '인식 중...' : '경험치 인식'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRecalibrating(true)}>
            <Crosshair size={16} />
            위치 다시 잡기
          </Button>
        </div>
      )}
    </div>
  );
}

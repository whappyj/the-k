/**
 * lib/expRoiCalibration.ts
 * 리니지 클래식 경험치 표시 영역을 "화면 대비 상대 좌표(%)"로 한 번 저장해두고,
 * 이후에는 해상도/창 크기가 달라도 같은 비율로 자동 크롭한다.
 * 전체화면 OCR을 계속 돌리지 않기 위한 핵심 장치 (규칙 1: ROI OCR 우선).
 */

const STORAGE_KEY = 'theKExpRoiCalibration';

export interface RelativeRoi {
  xPct: number; // 0~1
  yPct: number;
  wPct: number;
  hPct: number;
}

export function getExpRoiCalibration(): RelativeRoi | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RelativeRoi;
    if ([parsed.xPct, parsed.yPct, parsed.wPct, parsed.hPct].some((v) => typeof v !== 'number' || Number.isNaN(v))) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveExpRoiCalibration(roi: RelativeRoi): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roi));
}

export function clearExpRoiCalibration(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 픽셀 좌표(사용자가 화면에서 드래그한 영역)를 이미지 크기 대비 상대 좌표로 변환한다. */
export function toRelativeRoi(px: { x: number; y: number; w: number; h: number }, imageWidth: number, imageHeight: number): RelativeRoi {
  return {
    xPct: px.x / imageWidth,
    yPct: px.y / imageHeight,
    wPct: px.w / imageWidth,
    hPct: px.h / imageHeight,
  };
}

/** 상대 좌표 ROI를 실제 캔버스 크기에 맞춰 잘라낸다. 해상도가 달라도 항상 같은 비율 영역을 크롭한다. */
export function cropToRelativeRoi(canvas: HTMLCanvasElement, roi: RelativeRoi): HTMLCanvasElement {
  const x = Math.max(0, Math.round(roi.xPct * canvas.width));
  const y = Math.max(0, Math.round(roi.yPct * canvas.height));
  const w = Math.min(canvas.width - x, Math.round(roi.wPct * canvas.width));
  const h = Math.min(canvas.height - y, Math.round(roi.hPct * canvas.height));

  const out = document.createElement('canvas');
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(canvas, x, y, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

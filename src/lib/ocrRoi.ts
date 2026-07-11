import type { OcrBoundingBox, OcrWordResult } from '@/lib/ocrTypes';

/**
 * 인식된 단어들 중 주어진 패턴(예: 경험치 %, 레벨, 아이템명 후보)에 매치하는 단어들의
 * 합집합 영역(바운딩박스)을 찾는다. 사용자가 크롭 위치를 살짝 잘못 잡아도,
 * 전체 인식 결과에서 관심 영역을 다시 찾아내 2차로 정밀 재인식할 때 쓴다.
 */
export function findRoiFromWords(words: OcrWordResult[], pattern: RegExp): OcrBoundingBox | null {
  const matched = words.filter((w) => pattern.test(w.text));
  if (!matched.length) return null;
  return matched.reduce<OcrBoundingBox>(
    (acc, w) => ({
      x0: Math.min(acc.x0, w.bbox.x0),
      y0: Math.min(acc.y0, w.bbox.y0),
      x1: Math.max(acc.x1, w.bbox.x1),
      y1: Math.max(acc.y1, w.bbox.y1),
    }),
    { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  );
}

/** bbox 영역을 여백(padding)만큼 넓혀서 캔버스에서 잘라낸다 (ROI 2차 재인식용). */
export async function cropCanvasToRoi(source: HTMLCanvasElement, box: OcrBoundingBox, padding = 12): Promise<HTMLCanvasElement> {
  const x = Math.max(0, box.x0 - padding);
  const y = Math.max(0, box.y0 - padding);
  const w = Math.min(source.width - x, box.x1 - box.x0 + padding * 2);
  const h = Math.min(source.height - y, box.y1 - box.y0 + padding * 2);

  const out = document.createElement('canvas');
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, x, y, w, h, 0, 0, out.width, out.height);
  return out;
}

/** 경험치(%)나 레벨처럼 소수점·퍼센트가 포함된 토큰을 찾는 패턴.
 *  단순히 숫자만 찾으면 전체 화면의 HP/MP/좌표 등 무관한 숫자까지 넓게 잡혀버려서,
 *  경험치 표기에 가장 흔한 "소수점 숫자" 또는 "%" 위주로 좁혀 잡는다. */
export const NUMERIC_ROI_PATTERN = /^\d+\.\d+%?$|^\d+%$|^%$/;

/** 한글/영문이 2글자 이상 포함된 토큰을 찾는 기본 패턴 (아이템명 후보 탐색용). */
export const NAME_ROI_PATTERN = /[가-힣A-Za-z]{2,}/;

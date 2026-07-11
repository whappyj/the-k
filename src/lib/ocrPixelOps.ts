/**
 * lib/ocrPixelOps.ts
 * Canvas/DOM에 의존하지 않는 순수 픽셀 연산만 모아둔 모듈.
 * Web Worker와 메인 스레드(폴백용) 양쪽에서 동일하게 import해서 쓴다.
 */

export interface PreprocessOptions {
  contrast: number;
  denoise: boolean;
  adaptiveThreshold: boolean;
  sharpen: boolean;
  invert: boolean;
}

/** RGBA 픽셀 버퍼의 평균 밝기(0~255)를 계산한다. 실패 원인 분석("밝기 부족" 판정)에 사용한다. */
export function computeAverageBrightness(data: Uint8ClampedArray): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    sum += r * 0.299 + g * 0.587 + b * 0.114;
    count++;
  }
  return count ? sum / count : 0;
}

/** RGBA 픽셀 버퍼를 그레이스케일 밝기 배열(0~255)로 변환한다. */
export function toGrayscaleArray(data: Uint8ClampedArray): Float32Array {
  const gray = new Float32Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    gray[p] = r * 0.299 + g * 0.587 + b * 0.114;
  }
  return gray;
}

/** 수평/수직 분리형 박스 블러 (디노이즈 및 적응형 임계값의 "지역 평균" 계산에 재사용한다). */
export function boxBlur(gray: Float32Array, width: number, height: number, radius: number): Float32Array {
  const horizontal = new Float32Array(gray.length);
  const out = new Float32Array(gray.length);

  for (let y = 0; y < height; y++) {
    let sum = 0;
    const rowStart = y * width;
    for (let x = -radius; x <= radius; x++) {
      sum += gray[rowStart + Math.min(width - 1, Math.max(0, x))] ?? 0;
    }
    for (let x = 0; x < width; x++) {
      horizontal[rowStart + x] = sum / (radius * 2 + 1);
      const addX = Math.min(width - 1, x + radius + 1);
      const subX = Math.max(0, x - radius);
      const addValue = gray[rowStart + addX] ?? 0;
      const subValue = gray[rowStart + subX] ?? 0;
      sum += addValue - subValue;
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      sum += horizontal[Math.min(height - 1, Math.max(0, y)) * width + x] ?? 0;
    }
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / (radius * 2 + 1);
      const addY = Math.min(height - 1, y + radius + 1);
      const subY = Math.max(0, y - radius);
      const addValue = horizontal[addY * width + x] ?? 0;
      const subValue = horizontal[subY * width + x] ?? 0;
      sum += addValue - subValue;
    }
  }
  return out;
}

/**
 * 그레이스케일 → (선택)디노이즈 → 대비강화/적응형이진화 → (선택)샤픈 → (선택)반전 순으로 처리해
 * 새 RGBA 버퍼를 반환한다. Worker와 메인스레드 폴백이 이 함수 하나를 공유한다.
 */
export function applyPreprocessPipeline(rgba: Uint8ClampedArray, width: number, height: number, options: PreprocessOptions): Uint8ClampedArray {
  let gray = toGrayscaleArray(rgba);

  if (options.denoise) {
    gray = boxBlur(gray, width, height, 1);
  }

  if (options.adaptiveThreshold) {
    const local = boxBlur(gray, width, height, Math.max(4, Math.round(Math.min(width, height) * 0.02)));
    const C = 6;
    for (let p = 0; p < gray.length; p++) {
      const value = gray[p] ?? 0;
      const localValue = local[p] ?? 0;
      gray[p] = value < localValue - C ? 0 : 255;
    }
  } else {
    for (let p = 0; p < gray.length; p++) {
      const value = gray[p] ?? 0;
      gray[p] = Math.min(255, Math.max(0, (value - 128) * options.contrast + 128));
    }
  }

  if (options.sharpen) {
    const blurred = boxBlur(gray, width, height, 1);
    const AMOUNT = 0.6;
    for (let p = 0; p < gray.length; p++) {
      const value = gray[p] ?? 0;
      const blurredValue = blurred[p] ?? 0;
      gray[p] = Math.min(255, Math.max(0, value + (value - blurredValue) * AMOUNT));
    }
  }

  if (options.invert) {
    for (let p = 0; p < gray.length; p++) {
      const value = gray[p] ?? 0;
      gray[p] = 255 - value;
    }
  }

  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0, p = 0; i < out.length; i += 4, p++) {
    const value = gray[p] ?? 0;
    out[i] = out[i + 1] = out[i + 2] = value;
    out[i + 3] = 255;
  }
  return out;
}

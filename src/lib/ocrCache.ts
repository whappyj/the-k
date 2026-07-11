import type { OcrMode, PreprocessOptions } from '@/lib/ocrPreprocess';
import type { OcrRecognitionResult } from '@/lib/ocrTypes';

/**
 * 같은 이미지 + 같은 모드 + 같은 전처리 옵션 조합이 연속으로 들어오면 재인식하지 않는다.
 * 이미지 바이트를 SHA-256으로 해시해서 키로 쓴다.
 */
const recognitionCache = new Map<string, OcrRecognitionResult>();
const MAX_CACHE_ENTRIES = 30;

export async function hashRequest(canvas: HTMLCanvasElement, mode: OcrMode, options: PreprocessOptions): Promise<string> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const bytes = blob ? await blob.arrayBuffer() : new ArrayBuffer(0);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex}:${mode}:${JSON.stringify(options)}`;
}

export function getFromCache(key: string): OcrRecognitionResult | undefined {
  return recognitionCache.get(key);
}

export function putInCache(key: string, value: OcrRecognitionResult): void {
  if (recognitionCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = recognitionCache.keys().next().value;
    if (oldestKey) recognitionCache.delete(oldestKey);
  }
  recognitionCache.set(key, value);
}

/** 캐시를 비운다 (설정 변경, 메모리 확보 등에 사용). */
export function clearRecognitionCache(): void {
  recognitionCache.clear();
}

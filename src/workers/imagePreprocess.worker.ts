/// <reference lib="webworker" />
/**
 * workers/imagePreprocess.worker.ts
 * 그레이스케일/디노이즈/이진화/샤픈 같은 무거운 픽셀 연산을 메인 스레드 밖에서 수행한다.
 * Tesseract.js의 recognize() 자체는 이미 자체 Worker(WASM)에서 돌지만,
 * 우리가 직접 짠 전처리 픽셀 루프는 별도로 여기로 옮겨야 UI가 안 멈춘다.
 */
import { applyPreprocessPipeline } from '@/lib/ocrPixelOps';
import type { PreprocessOptions } from '@/lib/ocrPixelOps';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

export interface PreprocessRequest {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  options: PreprocessOptions;
}

export interface PreprocessResponse {
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

ctx.onmessage = (e: MessageEvent<PreprocessRequest>) => {
  const { buffer, width, height, options } = e.data;
  const rgba = new Uint8ClampedArray(buffer);
  const processed = applyPreprocessPipeline(rgba, width, height, options);
  const processedBuffer = processed.buffer as ArrayBuffer; // 항상 일반 ArrayBuffer로부터 생성되므로 안전한 단언

  const response: PreprocessResponse = { buffer: processedBuffer, width, height };
  // processedBuffer를 transfer해서 복사 없이 메인 스레드로 소유권을 넘긴다 (제로카피).
  ctx.postMessage(response, [processedBuffer]);
};

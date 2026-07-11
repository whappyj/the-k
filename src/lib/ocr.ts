import { createWorker, PSM } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { toCanvas, preprocessCanvas, defaultPreprocessOptions, preprocessVariants, terminatePixelWorker } from '@/lib/ocrPreprocess';
import type { OcrMode, PreprocessOptions } from '@/lib/ocrPreprocess';
import { hashRequest, getFromCache, putInCache, clearRecognitionCache } from '@/lib/ocrCache';
import { findRoiFromWords, cropCanvasToRoi } from '@/lib/ocrRoi';
import type { OcrRecognitionResult, OcrWordResult } from '@/lib/ocrTypes';

export type { OcrMode, PreprocessOptions } from '@/lib/ocrPreprocess';
export { defaultPreprocessOptions, preprocessVariants } from '@/lib/ocrPreprocess';
export type { OcrBoundingBox, OcrWordResult, OcrRecognitionResult } from '@/lib/ocrTypes';
export { clearRecognitionCache } from '@/lib/ocrCache';
export { NUMERIC_ROI_PATTERN, NAME_ROI_PATTERN } from '@/lib/ocrRoi';

let tesseractWorkerPromise: Promise<TesseractWorker> | null = null;

/** 한/영 OCR 워커를 최초 1회만 생성하고 이후 재사용한다 (매번 새로 만들면 느리다). */
function getTesseractWorker(): Promise<TesseractWorker> {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = createWorker('kor+eng');
  }
  return tesseractWorkerPromise!;
}

/** OCR 모드에 따라 적절한 Tesseract 페이지 세그멘테이션 모드를 고른다. */
function psmForMode(mode: OcrMode): PSM {
  if (mode === 'crop') return PSM.SPARSE_TEXT;
  if (mode === 'itemDetail') return PSM.SINGLE_BLOCK;
  return PSM.AUTO;
}

/**
 * 이미지에서 텍스트를 인식하고, 원문/신뢰도/단어별 신뢰도(+좌표)/처리시간/전처리된 이미지까지 함께 반환한다.
 * 동일 이미지+모드+옵션 조합은 해시로 캐시해 재인식을 건너뛴다.
 */
export async function recognizeWithDetails(
  source: File | Blob | string | HTMLCanvasElement | HTMLImageElement,
  mode: OcrMode = 'full',
  preprocessOverrides?: Partial<PreprocessOptions>
): Promise<OcrRecognitionResult> {
  const started = performance.now();
  const options: PreprocessOptions = { ...defaultPreprocessOptions(mode), ...preprocessOverrides };

  const rawCanvas = await toCanvas(source);
  const cacheKey = await hashRequest(rawCanvas, mode, options);
  const cached = getFromCache(cacheKey);
  if (cached) return { ...cached, fromCache: true, elapsedMs: 0 };

  const processed = await preprocessCanvas(rawCanvas, options);

  const worker = await getTesseractWorker();
  await worker.setParameters({ tessedit_pageseg_mode: psmForMode(mode) });
  const { data } = await worker.recognize(processed);

  const words: OcrWordResult[] = (data.words ?? []).map((w) => ({
    text: w.text,
    confidence: w.confidence,
    bbox: w.bbox,
  }));
  const confidence = words.length ? words.reduce((s, w) => s + w.confidence, 0) / words.length : data.confidence ?? 0;

  const result: OcrRecognitionResult = {
    text: data.text,
    confidence,
    words,
    elapsedMs: performance.now() - started,
    preprocessedImageUrl: processed.toDataURL('image/png'),
    fromCache: false,
  };

  putInCache(cacheKey, result);

  // 처리에 쓴 중간 캔버스의 백킹 스토어를 즉시 반환한다 (메모리 최적화).
  processed.width = 0;
  processed.height = 0;

  return result;
}

export interface AutoTuneAttempt {
  options: PreprocessOptions;
  confidence: number;
}

/**
 * 여러 전처리 조합을 시도해 신뢰도가 가장 높은 결과를 채택한다.
 * confidenceTarget 이상이 나오면 더 시도하지 않고 즉시 반환한다 (불필요한 재인식 방지).
 */
export async function recognizeWithAutoTune(
  source: File | Blob | string | HTMLCanvasElement | HTMLImageElement,
  mode: OcrMode = 'full',
  confidenceTarget = 85
): Promise<{ best: OcrRecognitionResult; attempts: number; triedOptions: PreprocessOptions[]; attemptResults: AutoTuneAttempt[] }> {
  const variants = preprocessVariants(mode);
  const canvas = await toCanvas(source);

  let best: OcrRecognitionResult | null = null;
  let attempts = 0;
  const triedOptions: PreprocessOptions[] = [];
  const attemptResults: AutoTuneAttempt[] = [];

  for (const options of variants) {
    attempts++;
    triedOptions.push(options);
    const result = await recognizeWithDetails(canvas, mode, options);
    attemptResults.push({ options, confidence: result.confidence });
    if (!best || result.confidence > best.confidence) best = result;
    if (best.confidence >= confidenceTarget) break;
  }

  return { best: best!, attempts, triedOptions, attemptResults };
}

/**
 * 가장 일반적으로 쓰는 진입점: 먼저 기본 설정으로 1번만 인식해보고,
 * 신뢰도가 낮으면(기본 70% 미만) 자동으로 여러 전처리 조합을 추가로 시도한다.
 * roiPattern을 주면, 인식된 단어들 중 그 패턴과 맞는 영역을 자동으로 찾아
 * (경험치 영역/아이템명 위치가 크롭과 살짝 어긋나 있어도) 그 부분만 다시 정밀 인식해본다.
 * 여러 시도 중 신뢰도가 가장 높은 결과를 최종 채택한다.
 */
export interface SmartRecognitionMeta {
  result: OcrRecognitionResult;
  autoTuned: boolean;
  attempts: number;
  attemptResults: AutoTuneAttempt[];
  roiAttempted: boolean;
  roiFound: boolean;
  originalCanvas: HTMLCanvasElement;
}

export async function recognizeSmart(
  source: File | Blob | string | HTMLCanvasElement | HTMLImageElement,
  mode: OcrMode = 'full',
  lowConfidenceThreshold = 70,
  roiPattern?: RegExp
): Promise<SmartRecognitionMeta> {
  const canvas = await toCanvas(source);
  const first = await recognizeWithDetails(canvas, mode);

  let best = first;
  let attempts = 1;
  let autoTuned = false;
  let attemptResults: AutoTuneAttempt[] = [{ options: defaultPreprocessOptions(mode), confidence: first.confidence }];

  if (first.confidence < lowConfidenceThreshold) {
    const tuned = await recognizeWithAutoTune(canvas, mode);
    attempts += tuned.attempts;
    autoTuned = true;
    attemptResults = tuned.attemptResults;
    if (tuned.best.confidence > best.confidence) best = tuned.best;
  }

  // ROI 자동 탐색: 관심 영역을 찾아 그 부분만 다시 정밀 인식해보고, 더 좋으면 채택한다.
  let roiAttempted = false;
  let roiFound = false;
  if (roiPattern && mode !== 'crop') {
    roiAttempted = true;
    const roi = findRoiFromWords(best.words, roiPattern);
    if (roi) {
      roiFound = true;
      const roiCanvas = await cropCanvasToRoi(canvas, roi);
      const roiResult = await recognizeWithDetails(roiCanvas, 'crop');
      attempts += 1;
      if (roiResult.confidence > best.confidence && roiResult.text.trim()) {
        best = roiResult;
        autoTuned = true;
      }
    }
  }

  return { result: best, autoTuned, attempts, attemptResults, roiAttempted, roiFound, originalCanvas: canvas };
}

/** 앱 종료/설정 변경 시 워커를 정리하고 싶을 때 사용한다 (선택적). */
export async function terminateOcrWorker(): Promise<void> {
  if (tesseractWorkerPromise) {
    const worker = await tesseractWorkerPromise;
    await worker.terminate();
    tesseractWorkerPromise = null;
  }
  terminatePixelWorker();
  clearRecognitionCache();
}

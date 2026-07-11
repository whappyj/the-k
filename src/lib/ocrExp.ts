import { PSM } from 'tesseract.js';
import { toCanvas, preprocessCanvas } from '@/lib/ocrPreprocess';
import type { PreprocessOptions } from '@/lib/ocrPreprocess';
import { recognizeNumeric } from '@/lib/ocrNumericEngine';
import { getExpRoiCalibration, cropToRelativeRoi } from '@/lib/expRoiCalibration';
import { normalizeExpValue, extractLevelCandidate } from '@/lib/expNormalize';
import type { NormalizedExp } from '@/lib/expNormalize';
import { findRoiFromWords, cropCanvasToRoi, NUMERIC_ROI_PATTERN } from '@/lib/ocrRoi';

/**
 * lib/ocrExp.ts
 * 리니지 클래식 경험치(%) 숫자만을 위한 전용 인식 파이프라인.
 * "전체 화면 OCR은 쓰지 않고 ROI OCR을 우선한다"는 원칙을 따른다:
 *   1) 사용자가 보정해둔 상대좌표 ROI가 있으면 그 영역만 바로 잘라서 숫자 전용 엔진으로 인식한다.
 *   2) 보정이 없으면, 예외적으로 딱 1번만 숫자 전용 엔진(넓은 PSM)으로 전체 화면을 훑어 위치를 찾는다.
 *   3) 이후 재시도는 전부 그 ROI 안에서만 이루어진다.
 * 최종 결과는 항상 { raw, value, unit, confidence } 형태로 정규화해서 반환한다.
 */

/** 숫자 ROI 재인식에 쓸 제한된 전처리 조합. 텍스트 전체용(preprocessVariants)보다 훨씬 좁게 잡는다. */
function numericPreprocessVariants(): PreprocessOptions[] {
  const base: PreprocessOptions = { upscale: true, contrast: 1.7, denoise: true, adaptiveThreshold: true, sharpen: true, invert: false };
  return [
    base,
    { ...base, invert: true },
    { ...base, adaptiveThreshold: false, contrast: 2.1 },
    { ...base, sharpen: false },
    { ...base, denoise: false, sharpen: false, contrast: 2.4 }, // 디노이즈가 얇은 글자 획을 뭉갤 때를 대비한 보수적 조합
    { ...base, adaptiveThreshold: false, invert: true, contrast: 2.1 }, // 밝은 배경에 어두운 글자가 아닌 반전된 스타일 대비
  ];
}

const NUMERIC_PSM_CANDIDATES = [PSM.SINGLE_LINE, PSM.SINGLE_WORD, PSM.SPARSE_TEXT];

/** 형식이 정상 범위(0~100%)를 벗어나면 신뢰도를 깎는다. */
function formatConfidencePenalty(normalized: NormalizedExp, rawConfidence: number): number {
  if (normalized.value === null) return rawConfidence * 0.3; // 아예 숫자를 못 뽑았으면 크게 감점
  if (normalized.value < 0 || normalized.value > 100) return rawConfidence * 0.5; // 범위를 벗어나면 의심스러운 값
  return rawConfidence;
}

export type ExpRoiSource = 'calibrated' | 'autoDetected' | 'fullScreen';

export interface ExpReading {
  raw: string; // 예: "32.4152%"
  value: number | null; // 예: 32.4152
  unit: '%';
  confidence: number; // 0~100, 형식 검증까지 반영한 최종 신뢰도
}

export interface ExpOcrAttempt {
  options: PreprocessOptions;
  psm: PSM;
  text: string;
  rawConfidence: number;
  reading: ExpReading;
}

export interface ExpOcrResult {
  reading: ExpReading; // { raw, value, unit, confidence }
  rawText: string; // 채택된 시도의 OCR 원문 (정규화 전)
  detectedLevel: number | null; // 경험치%와 같은 화면에서 함께 인식된 레벨 추정값 (없으면 null, 수동 입력으로 넘어감)
  attempts: ExpOcrAttempt[];
  roiSource: ExpRoiSource;
  originalCanvas: HTMLCanvasElement;
  roiCanvas: HTMLCanvasElement;
  preprocessedImageUrl: string;
  elapsedMs: number;
}

/**
 * 보정이 없을 때 딱 1번, "숫자 전용 엔진"으로 전체 화면을 훑어 경험치다운 위치를 찾아 ROI를 부트스트랩한다.
 * 한글/영문 일반 OCR은 전혀 쓰지 않는다 (경험치 인식에서 한글/영문 OCR 제외).
 */
async function bootstrapRoiFromFullScreen(canvas: HTMLCanvasElement): Promise<{ roiCanvas: HTMLCanvasElement; found: boolean }> {
  const { words } = await recognizeNumeric(canvas, PSM.SPARSE_TEXT);
  const box = findRoiFromWords(words, NUMERIC_ROI_PATTERN);
  if (!box) return { roiCanvas: canvas, found: false };
  const roiCanvas = await cropCanvasToRoi(canvas, box, 16);
  return { roiCanvas, found: true };
}

/**
 * 경험치(%) 값을 인식한다. 신뢰도가 낮으면 ROI 안에서 threshold/sharpen/invert 조합과
 * PSM(단일 줄 / 단일 단어)을 제한적으로 바꿔가며 재시도하고, 가장 신뢰도 높은 결과를 채택한다.
 * 결과는 항상 { raw: "32.4152%", value: 32.4152, unit: "%", confidence } 형태로 정규화된다.
 */
export async function recognizeExpValue(
  source: File | Blob | string | HTMLCanvasElement | HTMLImageElement,
  confidenceTarget = 85
): Promise<ExpOcrResult> {
  const started = performance.now();
  const originalCanvas = await toCanvas(source);

  let roiCanvas = originalCanvas;
  let roiSource: ExpRoiSource = 'fullScreen';

  const calibration = getExpRoiCalibration();
  if (calibration) {
    roiCanvas = cropToRelativeRoi(originalCanvas, calibration);
    roiSource = 'calibrated';
  } else {
    const bootstrap = await bootstrapRoiFromFullScreen(originalCanvas);
    roiCanvas = bootstrap.roiCanvas;
    roiSource = bootstrap.found ? 'autoDetected' : 'fullScreen';
  }

  const attempts: ExpOcrAttempt[] = [];
  let best: ExpOcrAttempt | null = null;
  let bestPreprocessedUrl = '';

  outer: for (const options of numericPreprocessVariants()) {
    const processed = await preprocessCanvas(roiCanvas, options);
    const previewUrl = processed.toDataURL('image/png');

    for (const psm of NUMERIC_PSM_CANDIDATES) {
      const { text, confidence } = await recognizeNumeric(processed, psm);
      const normalized = normalizeExpValue(text); // 항상 "32.4152%" 표준 형태 + Number로 정규화
      const finalConfidence = formatConfidencePenalty(normalized, confidence);

      const attempt: ExpOcrAttempt = {
        options,
        psm,
        text,
        rawConfidence: confidence,
        reading: { ...normalized, confidence: finalConfidence },
      };
      attempts.push(attempt);

      if (!best || attempt.reading.confidence > best.reading.confidence) {
        best = attempt;
        bestPreprocessedUrl = previewUrl;
      }
      if (best.reading.confidence >= confidenceTarget) break outer;
    }

    processed.width = 0;
    processed.height = 0;
  }

  const winner = best!;
  return {
    reading: winner.reading,
    rawText: winner.text,
    detectedLevel: extractLevelCandidate(winner.text),
    attempts,
    roiSource,
    originalCanvas,
    roiCanvas,
    preprocessedImageUrl: bestPreprocessedUrl,
    elapsedMs: performance.now() - started,
  };
}

import { createWorker, PSM } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';

/**
 * lib/ocrNumericEngine.ts
 * 경험치(%) 숫자만 읽기 위한 전용 Tesseract 워커.
 * 한글 언어팩은 필요 없어서(숫자만 볼 것이므로) 'eng'만 로드해 더 가볍고 빠르다.
 * tessedit_char_whitelist로 숫자/소수점/%/,// 외의 문자는 애초에 후보에서 제외한다.
 */

const EXP_WHITELIST = '0123456789.,/%';

let numericWorkerPromise: Promise<TesseractWorker> | null = null;

async function getNumericWorker(): Promise<TesseractWorker> {
  if (!numericWorkerPromise) {
    numericWorkerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: EXP_WHITELIST,
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
    })();
  }
  return numericWorkerPromise;
}

export interface NumericWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface NumericOcrResult {
  text: string;
  confidence: number;
  words: NumericWord[];
}

/** 화이트리스트가 적용된 숫자 전용 엔진으로 인식한다. psm을 바꿔가며 재시도할 때 사용한다. */
export async function recognizeNumeric(source: HTMLCanvasElement, psm: PSM = PSM.SINGLE_LINE): Promise<NumericOcrResult> {
  const worker = await getNumericWorker();
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const { data } = await worker.recognize(source);
  const words: NumericWord[] = (data.words ?? []).map((w) => ({ text: w.text, confidence: w.confidence, bbox: w.bbox }));
  return { text: data.text, confidence: data.confidence, words };
}

/** 정리(설정 변경, 라우트 이탈 등)를 위해 숫자 전용 워커를 종료한다. */
export async function terminateNumericWorker(): Promise<void> {
  if (numericWorkerPromise) {
    const worker = await numericWorkerPromise;
    await worker.terminate();
    numericWorkerPromise = null;
  }
}

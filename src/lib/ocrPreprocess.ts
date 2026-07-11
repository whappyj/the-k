import { applyPreprocessPipeline } from '@/lib/ocrPixelOps';
import type { PreprocessOptions as PixelOptions } from '@/lib/ocrPixelOps';

export type OcrMode = 'full' | 'crop' | 'itemDetail';

export interface PreprocessOptions extends PixelOptions {
  /** 작은 이미지를 몇 배로 키울지. false면 업스케일하지 않는다. */
  upscale: boolean;
}

/** 모드별로 무난하게 동작하는 기본 전처리 조합. 필요하면 호출부에서 개별 옵션을 덮어쓸 수 있다. */
export function defaultPreprocessOptions(mode: OcrMode): PreprocessOptions {
  if (mode === 'crop') {
    return { upscale: true, contrast: 1.6, denoise: true, adaptiveThreshold: true, sharpen: true, invert: false };
  }
  if (mode === 'itemDetail') {
    return { upscale: true, contrast: 1.4, denoise: true, adaptiveThreshold: true, sharpen: false, invert: false };
  }
  return { upscale: true, contrast: 1.3, denoise: false, adaptiveThreshold: false, sharpen: false, invert: false };
}

/** 자동 튜닝 시 순서대로 시도해볼 옵션 조합 후보들. */
export function preprocessVariants(mode: OcrMode): PreprocessOptions[] {
  const base = defaultPreprocessOptions(mode);
  return [
    base,
    { ...base, adaptiveThreshold: !base.adaptiveThreshold },
    { ...base, invert: true },
    { ...base, sharpen: !base.sharpen },
    { ...base, contrast: base.contrast + 0.4, adaptiveThreshold: false },
    { ...base, denoise: !base.denoise },
  ];
}

/** 입력을 캔버스로 변환한다 (File/Blob/DataURL/HTMLCanvasElement/HTMLImageElement 모두 지원). */
export async function toCanvas(source: File | Blob | string | HTMLCanvasElement | HTMLImageElement): Promise<HTMLCanvasElement> {
  if (source instanceof HTMLCanvasElement) return source;

  const img = source instanceof HTMLImageElement ? source : await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
  });
}

/* ---------------------------------------------------------------- *
 * 전처리 Worker (픽셀 연산을 메인 스레드 밖에서 수행)
 * ---------------------------------------------------------------- */

let pixelWorker: Worker | null = null;
function getPixelWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null; // 매우 오래된 환경 폴백
  if (!pixelWorker) {
    pixelWorker = new Worker(new URL('../workers/imagePreprocess.worker.ts', import.meta.url), { type: 'module' });
  }
  return pixelWorker;
}

/** Worker에게 픽셀 버퍼를 보내고 처리된 결과를 돌려받는다. Worker를 못 쓰는 환경이면 메인스레드에서 직접 계산한다. */
function runPreprocessPixels(rgba: Uint8ClampedArray, width: number, height: number, options: PixelOptions): Promise<Uint8ClampedArray> {
  const worker = getPixelWorker();
  if (!worker) {
    return Promise.resolve(applyPreprocessPipeline(rgba, width, height, options));
  }

  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<{ buffer: ArrayBuffer; width: number; height: number }>) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      resolve(new Uint8ClampedArray(e.data.buffer));
    };
    const onError = (err: ErrorEvent) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(err);
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    // rgba.buffer를 transfer로 넘겨 복사 비용 없이 소유권을 이전한다 (제로카피).
    worker.postMessage({ buffer: rgba.buffer, width, height, options }, [rgba.buffer]);
  });
}

/** 정리(설정 변경, 라우트 이탈 등)를 위해 전처리 Worker를 종료한다. */
export function terminatePixelWorker(): void {
  if (pixelWorker) {
    pixelWorker.terminate();
    pixelWorker = null;
  }
}

/** 그레이스케일/디노이즈/이진화/샤픈/반전을 Worker에서 처리하고, 업스케일까지 적용한 최종 캔버스를 반환한다. */
export async function preprocessCanvas(canvas: HTMLCanvasElement, options: PreprocessOptions): Promise<HTMLCanvasElement> {
  const MIN_DIMENSION = 300;
  const shortSide = Math.min(canvas.width, canvas.height);
  const scale = !options.upscale ? 1 : shortSide < MIN_DIMENSION ? 3 : shortSide < 600 ? 2 : 1;

  const scaled = document.createElement('canvas');
  scaled.width = canvas.width * scale;
  scaled.height = canvas.height * scale;
  const scaledCtx = scaled.getContext('2d');
  if (!scaledCtx) return canvas;
  scaledCtx.imageSmoothingEnabled = true;
  scaledCtx.imageSmoothingQuality = 'high';
  scaledCtx.drawImage(canvas, 0, 0, scaled.width, scaled.height);

  const imageData = scaledCtx.getImageData(0, 0, scaled.width, scaled.height);
  const processedRgba = await runPreprocessPixels(imageData.data, scaled.width, scaled.height, options);

  const out = document.createElement('canvas');
  out.width = scaled.width;
  out.height = scaled.height;
  const outCtx = out.getContext('2d');
  if (!outCtx) return scaled;
  outCtx.putImageData(new ImageData(processedRgba as Uint8ClampedArray<ArrayBuffer>, scaled.width, scaled.height), 0, 0);

  // 중간 캔버스는 더 쓸 일이 없으니 백킹 스토어를 즉시 반환한다 (메모리 최적화).
  scaled.width = 0;
  scaled.height = 0;

  return out;
}

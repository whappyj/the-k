export interface OcrBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWordResult {
  text: string;
  confidence: number; // 0~100
  bbox: OcrBoundingBox;
}

export interface OcrRecognitionResult {
  text: string;
  confidence: number;
  words: OcrWordResult[];
  elapsedMs: number;
  preprocessedImageUrl: string;
  fromCache: boolean;
}

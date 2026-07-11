import type { AppData, AppSettings } from '@/types';
import { APP_VERSION, DEFAULT_SETTINGS } from '@/constants';

/** 내부 상태를 PRD가 명시한 표준 내보내기 스키마로 변환한다. */
export interface ExportSchema {
  version: string;
  exportedAt: string;
  experienceRecords: AppData['experienceRecords'];
  calculator24Records: AppData['calculator24Records'];
  favoriteParties: AppData['favoriteParties'];
  estimatePresets: AppData['estimate']['presets'];
  customTabs: AppData['customTabs'];
  items: AppData['items'];
  purchaseSettings: AppData['purchaseSettings'];
  purchaseRecords: AppData['purchaseRecords'];
  expGoal: AppData['expGoal'];
  settings: AppSettings;
}

export function toExportSchema(data: AppData): ExportSchema {
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    experienceRecords: data.experienceRecords,
    calculator24Records: data.calculator24Records,
    favoriteParties: data.favoriteParties,
    estimatePresets: data.estimate.presets,
    customTabs: data.customTabs,
    items: data.items,
    purchaseSettings: data.purchaseSettings,
    purchaseRecords: data.purchaseRecords,
    expGoal: data.expGoal,
    settings: data.settings,
  };
}

/**
 * 전체 데이터를 THE K 전용 백업 파일(.thek)로 다운로드한다.
 * 파일 내용 자체는 UTF-8 JSON(Pretty)이고, 확장자만 THE K 백업 파일임을 명확히 하기 위해 .thek를 쓴다.
 */
export function downloadJSON(data: AppData): void {
  const payload = toExportSchema(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `THE-K-backup-${stamp}.thek`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 가져온 파일이 THE K 백업 파일로서 최소 형태를 갖췄는지 검증한다. 문제 없으면 null. */
export function validateImportPayload(json: unknown): string | null {
  if (!json || typeof json !== 'object') return '올바른 THE K 백업 파일(.thek)이 아닙니다.';
  const obj = json as Record<string, unknown>;
  const arrayKeys = ['experienceRecords', 'calculator24Records', 'favoriteParties', 'estimatePresets', 'customTabs', 'items', 'purchaseRecords'];
  for (const key of arrayKeys) {
    if (key in obj && !Array.isArray(obj[key])) return `손상된 데이터입니다 (${key}).`;
  }
  return null;
}

/** 가져온 데이터(표준 스키마)를 IMPORT_MERGE 액션 payload 형태(Partial&lt;AppData&gt;)로 변환한다. */
export function parseImportPayload(json: unknown): Partial<AppData> {
  const obj = json as Partial<ExportSchema>;
  return {
    experienceRecords: obj.experienceRecords,
    calculator24Records: obj.calculator24Records,
    favoriteParties: obj.favoriteParties,
    customTabs: obj.customTabs,
    items: obj.items,
    purchaseSettings: obj.purchaseSettings,
    purchaseRecords: obj.purchaseRecords,
    expGoal: obj.expGoal,
    estimate: obj.estimatePresets ? ({ presets: obj.estimatePresets } as AppData['estimate']) : undefined,
    settings: obj.settings ? { ...DEFAULT_SETTINGS, ...obj.settings } : undefined,
  };
}

/** File 객체를 읽어 JSON으로 파싱한다 (.thek/.json 공용 — 내용은 둘 다 JSON 텍스트). */
export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

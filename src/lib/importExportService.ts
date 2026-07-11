import { APP_VERSION } from '@/constants';

/**
 * lib/importExportService.ts
 * 기능별(경험치/아데나매입/아이템비교/제작계산기/설정) 내보내기·불러오기가 전부
 * 이 서비스 하나를 거쳐 동일한 방식으로 동작한다: 파일 확장자는 .thek(내용은 JSON),
 * 파일 안에 "어떤 섹션 데이터인지"(thekSection)를 표시해서, 불러오기 시 다른 섹션
 * 파일을 잘못 선택해도 안전하게 걸러낸다.
 */

export type ThekSection = 'experience' | 'adena' | 'items' | 'estimate' | 'settings' | 'full';

export interface SectionExportFile<T> {
  thek: true;
  thekSection: ThekSection;
  version: string;
  exportedAt: string;
  data: T;
}

/** 섹션 데이터를 .thek 파일로 다운로드한다. */
export function exportSection<T>(section: ThekSection, data: T, filenameLabel: string): void {
  const payload: SectionExportFile<T> = {
    thek: true,
    thekSection: section,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `THE-K-${filenameLabel}-${stamp}.thek`;
  a.click();
  URL.revokeObjectURL(url);
}

/** File 객체를 읽어 JSON으로 파싱한다 (.thek/.json 공용 — 내용은 UTF-8 JSON 텍스트). */
export function readThekFile(file: File): Promise<unknown> {
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

export type ParseSectionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SECTION_LABEL: Record<ThekSection, string> = {
  experience: '경험치',
  adena: '아데나 매입',
  items: '아이템 비교',
  estimate: '제작 계산기',
  settings: '설정',
  full: '전체 백업',
};

/**
 * 불러온 JSON이 기대한 섹션의 .thek 파일인지 검증하고 data를 꺼낸다.
 * 다른 섹션 파일(예: 아이템비교 화면에서 경험치 파일 선택)을 실수로 골라도
 * 안전하게 거부하고 어떤 파일이었는지 알려준다.
 */
export function parseSectionFile<T>(json: unknown, expectedSection: ThekSection): ParseSectionResult<T> {
  if (!json || typeof json !== 'object') return { ok: false, error: '올바른 .thek 파일이 아닙니다.' };
  const obj = json as Record<string, unknown>;

  // 구버전 "전체 백업" 파일(섹션 표시가 없는)도 호환되게, full 섹션을 기대할 때는 통과시킨다.
  if (expectedSection === 'full') {
    if (!('experienceRecords' in obj) && obj.thekSection !== 'full') {
      return { ok: false, error: '전체 백업 파일이 아닙니다.' };
    }
    return { ok: true, data: obj as T };
  }

  if (obj.thekSection !== expectedSection) {
    const foundLabel = typeof obj.thekSection === 'string' ? (SECTION_LABEL[obj.thekSection as ThekSection] ?? obj.thekSection) : '알 수 없는 파일';
    return { ok: false, error: `이 파일은 "${foundLabel}" 데이터입니다. "${SECTION_LABEL[expectedSection]}" 파일을 선택해주세요.` };
  }
  if (!('data' in obj)) return { ok: false, error: '데이터가 비어있는 파일입니다.' };
  return { ok: true, data: obj.data as T };
}

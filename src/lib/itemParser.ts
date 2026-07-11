import type { ItemStat, ItemRecord, WeaponCategory } from '@/types';
import { generateId } from '@/utils/id';
import { correctOcrText, correctItemOcrDictionary, findClosestName, stringSimilarity } from '@/lib/ocrCorrection';

export interface ParsedItemDraft {
  name: string;
  nameCorrected: boolean;
  nameSimilarity: number | null;
  weaponCategory: WeaponCategory | null;
  enchantValue: string | null; // 화면에 표시된 현재 강화 수치("+0" 등). OCR에서만 나오는 값 — memo에 반영한다.
  stats: ItemStat[];
  options: string[];
  correctedText: string;
  /** THE K DB와 유사도 90% 이상으로 자동 매칭된 아이템. 있으면 등록 시 DB 값을 우선 적용해야 한다. */
  dbMatch: ItemRecord | null;
  dbMatchSimilarity: number | null;
}

/** 인벤 상세페이지 상단의 "창고O｜사망 시 드롭O｜교환O｜삭제O" 메타정보 줄인지 판별한다 (아이템 스탯이 아니므로 무시해야 한다). */
function isMetaInfoLine(line: string): boolean {
  const metaKeywords = ['창고', '사망', '드롭', '교환', '삭제'];
  const hitCount = metaKeywords.filter((k) => line.includes(k)).length;
  if (hitCount >= 2) return true;

  // 섹션 헤더/장식용 텍스트(스탯이 아님)도 함께 걸러낸다.
  const headerOnlyLines = ['아이템 정보', '상세 보기', '아이템정보'];
  if (headerOnlyLines.includes(line.replace(/\s/g, ''))) return true;

  return false;
}

/** "활/검/둔기/창/도끼/석궁" 등 종류 값을 무기 대분류로 매핑한다. 모르는 값이면 null. */
function inferWeaponCategory(typeValue: string): WeaponCategory | null {
  const v = typeValue.replace(/\s/g, '');
  const rangedKeywords = ['활', '석궁', '보우', '크로스보우'];
  const meleeKeywords = ['검', '도', '둔기', '창', '단검', '도끼', '너클', '메이스'];
  if (rangedKeywords.some((k) => v.includes(k))) return 'ranged';
  if (meleeKeywords.some((k) => v.includes(k))) return 'melee';
  return null;
}

/** 알려진 스탯/정보 라벨 목록. 이 라벨만 있는 줄을 만나면 "다음 줄이 값"인 2줄 패턴으로 처리한다. */
const KNOWN_LABELS = [
  '종류', '공격력(작은/큰)', '공격력', '한손/양손', '클래스', '무게', '재질',
  '인챈트', '손상 여부', '옵션', '원거리 명중', '원거리 대미지', '근거리 명중', '근거리 대미지',
];

/** "라벨 : 값" / "라벨: 값" / "라벨  값" 형태의 줄에서 라벨과 값을 분리한다. */
function splitLabelValue(line: string): { label: string; value: string } | null {
  const colonMatch = line.match(/^([^:：]{1,12})[:：]\s*(.+)$/);
  if (colonMatch) return { label: (colonMatch[1] ?? '').trim(), value: (colonMatch[2] ?? '').trim() };

  const spaceMatch = line.match(/^([가-힣A-Za-z()/\s]{1,14}?)\s{1,}([\d+\-~%].*)$/);
  if (spaceMatch) return { label: (spaceMatch[1] ?? '').trim(), value: (spaceMatch[2] ?? '').trim() };

  return null;
}

/** 첫 줄에서 "+숫자" 강화 수치를 분리한다. 예: "+0 사이하의 활" -> { enchant: "+0", rest: "사이하의 활" } */
function splitEnchantFromName(line: string): { enchant: string | null; rest: string } {
  const m = line.match(/^([+＋]\d{1,2})\s*(.*)$/);
  if (m) return { enchant: m[1] ?? null, rest: (m[2] ?? '').trim() };
  return { enchant: null, rest: line };
}

/**
 * OCR 원본 텍스트를 아이템 초안으로 변환한다. 어디까지나 "추정"이며,
 * 사용자가 이후 편집 화면(등록 미리보기)에서 반드시 확인/수정한다는 전제로 설계했다.
 *
 * 처리 순서:
 * 1) 공통 보정(correctOcrText) + 아이템 전용 사전 보정(correctItemOcrDictionary)
 * 2) 메타정보 줄("창고O｜사망 시...") 제거
 * 3) "라벨\n값" 2줄 패턴 / "라벨: 값" 1줄 패턴을 모두 지원해 스탯을 파싱
 * 4) "종류" 라벨이 있으면 무기 대분류(weaponCategory) 추론
 * 5) 첫 줄에서 강화 수치(+0 등)를 분리하고, 남은 이름을 THE K DB와 유사도 비교
 *    — 90% 이상이면 dbMatch로 자동 선택(요구사항 4), 60~90%는 이름만 보정
 *
 * @param rawText OCR 원문
 * @param knownItems THE K DB에 이미 등록된 아이템 전체 — 이름 유사도 보정/자동매칭에 사용한다.
 */
export function parseOcrTextToItemDraft(rawText: string, knownItems: ItemRecord[] = []): ParsedItemDraft {
  const correctedText = correctItemOcrDictionary(correctOcrText(rawText));
  const allLines = correctedText.split('\n').filter(Boolean);
  const lines = allLines.filter((line) => !isMetaInfoLine(line));

  if (lines.length === 0) {
    return {
      name: '', nameCorrected: false, nameSimilarity: null, weaponCategory: null, enchantValue: null,
      stats: [], options: [], correctedText, dbMatch: null, dbMatchSimilarity: null,
    };
  }

  const { enchant, rest: firstLineName } = splitEnchantFromName(lines[0] ?? '');
  const bodyLines = lines.slice(1);

  const stats: ItemStat[] = [];
  const options: string[] = [];
  let weaponCategory: WeaponCategory | null = null;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i] ?? '';

    // 1) "라벨: 값" 또는 "라벨  값"이 한 줄에 있는 경우
    const inline = splitLabelValue(line);
    if (inline && inline.label.length <= 14) {
      if (inline.label === '종류') {
        weaponCategory = inferWeaponCategory(inline.value);
      } else {
        stats.push({ key: generateId(), label: inline.label, value: inline.value });
      }
      continue;
    }

    // 2) 라벨만 있는 줄 + 다음 줄이 값인 2줄 패턴 (인벤 상세페이지 실제 구조)
    const knownLabel = KNOWN_LABELS.find((l) => line === l || line.replace(/\s/g, '') === l.replace(/\s/g, ''));
    if (knownLabel && i + 1 < bodyLines.length) {
      const valueLine = bodyLines[i + 1] ?? '';
      if (knownLabel === '종류') {
        weaponCategory = inferWeaponCategory(valueLine);
      } else if (knownLabel === '옵션') {
        options.push(valueLine);
      } else {
        stats.push({ key: generateId(), label: knownLabel, value: valueLine });
      }
      i += 1; // 값 줄은 이미 소비했으므로 건너뛴다.
      continue;
    }

    // 3) 어디에도 안 걸리면 옵션(특수효과) 후보로만 둔다 — 원문을 그대로 아이템명/스탯에 흘려보내지 않는다.
    if (line.length > 0) options.push(line);
  }

  // 요구사항: 아이템명 유사도 비교 — 90% 이상이면 THE K DB에서 자동으로 그 아이템을 선택한다.
  const knownNames = knownItems.map((it) => it.name);
  const closest = findClosestName(firstLineName, knownNames, 0.6);
  const name = closest ? closest.name : firstLineName;

  let dbMatch: ItemRecord | null = null;
  let dbMatchSimilarity: number | null = null;
  if (firstLineName) {
    let best: { item: ItemRecord; similarity: number } | null = null;
    for (const item of knownItems) {
      const sim = stringSimilarity(firstLineName.trim(), item.name.trim());
      if (!best || sim > best.similarity) best = { item, similarity: sim };
    }
    if (best && best.similarity >= 0.9) {
      dbMatch = best.item;
      dbMatchSimilarity = best.similarity;
    }
  }

  return {
    name,
    nameCorrected: Boolean(closest),
    nameSimilarity: closest ? closest.similarity : null,
    weaponCategory,
    enchantValue: enchant,
    stats,
    options,
    correctedText,
    dbMatch,
    dbMatchSimilarity,
  };
}

/** 라벨이 같은 기존 스탯 행이 있으면 값을 덮어쓰고, 없으면 새 행으로 추가한다. */
export function mergeStats(current: ItemStat[], parsed: ItemStat[]): ItemStat[] {
  const result = [...current];
  parsed.forEach((p) => {
    const idx = result.findIndex((s) => s.label === p.label);
    if (idx >= 0) {
      const existing = result[idx]!;
      result[idx] = { ...existing, value: p.value };
    } else {
      result.push(p);
    }
  });
  return result;
}

/**
 * lib/ocrCorrection.ts
 * OCR 원문 텍스트를 실제 게임 화면 기준으로 보정하는 공통 유틸.
 * itemParser가 이 모듈을 거쳐서 텍스트를 해석한다. (경험치 OCR은 lib/ocrExp.ts의 숫자 전용 파이프라인을 별도로 사용한다.)
 */

/** 전각 숫자/기호를 반각으로, 흔한 OCR 오인식 기호를 정리한다. */
function normalizeWidthAndSymbols(text: string): string {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 전각숫자 -> 반각
    .replace(/[：]/g, ':')
    .replace(/[，]/g, ',')
    .replace(/[．]/g, '.')
    .replace(/[〜～]/g, '~')
    .replace(/[ㆍ・]/g, '.');
}

/**
 * 숫자로 해석되어야 할 문자열 안에서 흔히 오인식되는 문자를 숫자로 교정한다.
 * 예: "3２.4l52%" -> "32.4152%", "l0" -> "10"
 * 문자열 전체가 아니라 숫자 주변에서만 국소적으로 치환해 오탐(false positive)을 줄인다.
 */
export function correctNumericGlyphs(text: string): string {
  return text.replace(/[0-9OolISBZ]{2,}(?:[.,][0-9OolISBZ]+)?/g, (chunk) => {
    return chunk
      .replace(/[Oo]/g, '0')
      .replace(/[lI|]/g, '1')
      .replace(/[Ss]/g, '5')
      .replace(/[Zz]/g, '2')
      .replace(/[Bb](?=[0-9])/g, '8');
  });
}

/**
 * 한글/영문/숫자/일반 기호 외에 OCR이 종종 흘려 넣는 잡음 문자를 제거한다.
 * (예: 제어문자, 사설 영역(private use area) 글리프, 이모지 깨짐 등)
 */
export function removeInvalidCharacters(text: string): string {
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // 제어문자
    .replace(/[\uE000-\uF8FF]/g, '') // Private Use Area (깨진 글리프)
    .replace(/[^\S\r\n]{2,}/g, ' '); // 탭 등 연속 공백류 정리 (줄바꿈은 보존)
}

/** OCR 원문에 공통 보정을 적용한다 (잡음 제거 + 전각 정리 + 숫자 오인식 보정 + 공백 정리). */
export function correctOcrText(rawText: string): string {
  const cleaned = removeInvalidCharacters(rawText);
  const widthFixed = normalizeWidthAndSymbols(cleaned);
  const numberFixed = correctNumericGlyphs(widthFixed);
  return numberFixed
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * 아이템 OCR에서 자주 틀리는 토큰을 실제 게임 표기로 바꾸는 사전(dictionary) 보정.
 * 예: "+WOV" -> "+0", "EEO" -> "드롭O", "REO" -> "교환O", "AHO" -> "삭제O".
 * 정규식 순서가 중요하다 — 긴/구체적인 패턴을 먼저 치환해야 짧은 패턴이 잘못 끼어드는 걸 막는다.
 */
const ITEM_OCR_DICTIONARY: { pattern: RegExp; replace: string }[] = [
  // 인벤 상세페이지 상단의 "창고O｜사망 시 드롭O｜교환O｜삭제O" 메타 줄이 깨지는 패턴들
  { pattern: /EEO/g, replace: '드롭O' },
  { pattern: /REO/g, replace: '교환O' },
  { pattern: /AHO/g, replace: '삭제O' },
  // 인챈트 수치("+0" 등)가 "+WOV", "+VV0" 처럼 깨지는 패턴
  { pattern: /\+WOV\b/g, replace: '+0' },
  { pattern: /\bWOV\b/g, replace: '0' },
  { pattern: /\bVV\b/g, replace: 'W' },
  // 낱개 문자 오인식(단어 경계에서만 치환해 일반 텍스트를 오염시키지 않는다)
  { pattern: /\bO\b/g, replace: '0' },
  { pattern: /\bI\b/g, replace: '|' },
  { pattern: /\bl\b/g, replace: '1' },
];

/** 아이템 OCR 전용 사전 보정을 적용한다. correctOcrText 이후에 이어서 호출한다. */
export function correctItemOcrDictionary(text: string): string {
  let result = text;
  for (const { pattern, replace } of ITEM_OCR_DICTIONARY) {
    result = result.replace(pattern, replace);
  }
  return result;
}

/** "Lv75" / "Lv.75" / "레벨 75" / "LV：75" 등에서 레벨 숫자만 뽑는다. */
export function normalizeLevel(text: string): string | null {
  const m = text.match(/(?:lv\.?|레벨)\s*[:：]?\s*(\d{1,3})/i);
  return m ? (m[1] ?? null) : null;
}

/**
 * 경험치(%) 숫자를 뽑는다. 소수점 자리수가 OCR로 밀리는 경우가 많아
 * "32.4152%"처럼 확실한 % 표기를 우선하고, 없으면 0~100 범위의 소수를 후보로 잡는다.
 */
export function normalizeExpPercent(text: string): number | null {
  const withPercent = Array.from(text.matchAll(/(\d{1,3}\.\d{1,4})\s*%/g)).map((m) => Number(m[1]));
  const valid = withPercent.find((v) => v >= 0 && v <= 100);
  if (valid !== undefined) return valid;

  // % 기호까지 인식하지 못한 경우, 소수점을 포함한 0~100 사이 숫자를 차선책으로 사용한다.
  const bare = Array.from(text.matchAll(/\b(\d{1,3}\.\d{1,4})\b/g)).map((m) => Number(m[1]));
  const fallback = bare.find((v) => v >= 0 && v <= 100);
  return fallback ?? null;
}

/** 두 문자열의 편집거리(Levenshtein distance)를 계산한다. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const top = dp[i - 1]![j]!;
      const left = dp[i]![j - 1]!;
      const diag = dp[i - 1]![j - 1]!;
      dp[i]![j] = Math.min(top + 1, left + 1, diag + cost);
    }
  }
  return dp[a.length]![b.length]!;
}

/** 0(전혀 다름) ~ 1(완전히 같음) 사이의 문자열 유사도. */
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * OCR로 읽은 아이템명을 후보 목록(주로 THE K DB에 이미 있는 이름들)과 비교해
 * 가장 유사한 이름을 찾는다. threshold 미만이면 보정하지 않는다 (오탐 방지).
 */
export function findClosestName(ocrName: string, candidates: string[], threshold = 0.6): { name: string; similarity: number } | null {
  let best: { name: string; similarity: number } | null = null;
  for (const candidate of candidates) {
    const sim = stringSimilarity(ocrName.trim(), candidate.trim());
    if (!best || sim > best.similarity) best = { name: candidate, similarity: sim };
  }
  if (best && best.similarity >= threshold && best.name !== ocrName.trim()) return best;
  return null;
}

/**
 * 텍스트를 토큰(공백 기준) 단위로 쪼개 사전(dictionary)에 있는 단어와 비교하고,
 * 충분히 유사하지만 정확히 일치하지는 않는 토큰을 사전 단어로 치환한다.
 * 아이템명뿐 아니라 사냥터명 등 "알려진 단어 목록"이 있는 모든 곳에 재사용할 수 있는 범용 버전이다.
 */
export function correctWithDictionary(text: string, dictionary: string[], threshold = 0.7): string {
  if (!dictionary.length) return text;
  return text
    .split(/(\s+)/) // 구분자(공백)를 보존해서 다시 합칠 수 있게 캡처 그룹으로 split
    .map((token) => {
      if (!token.trim()) return token;
      const match = findClosestName(token, dictionary, threshold);
      return match ? match.name : token;
    })
    .join('');
}

/**
 * 원문 대비 보정이 얼마나 이루어졌는지를 바탕으로 0~100 사이의 신뢰도 점수를 매긴다.
 * 원문과 보정 결과가 같을수록(=고칠 게 없었을수록) 신뢰도가 높고,
 * 편집거리가 클수록(=많이 고쳐야 했을수록) 신뢰도가 낮아진다.
 */
export function scoreConfidence(original: string, corrected: string): number {
  const a = original.trim();
  const b = corrected.trim();
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  return Math.round(stringSimilarity(a, b) * 100);
}

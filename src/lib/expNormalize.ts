/**
 * lib/expNormalize.ts
 * OCR로 읽은 경험치 원문을 항상 "32.4152%" 같은 표준 형태로 정규화한다.
 * - 숫자와 '.' 외 문자는 전부 제거
 * - '%'가 없으면 자동으로 붙인다
 * - 소수점이 2개 이상이면(OCR 잡음으로 흔함) 가장 그럴듯한 위치 하나만 남긴다
 * - 최종적으로 표시용 문자열(raw)과 숫자(value)를 함께 반환한다
 */

export interface NormalizedExp {
  raw: string; // 예: "32.4152%" — 표시/저장용 표준 문자열. 파싱 실패 시 빈 문자열.
  value: number | null; // 예: 32.4152
  unit: '%';
}

/** 경험치는 항상 0~100% 범위이므로, 정수부가 이 범위를 벗어나는 소수점 위치 후보는 제외한다. */
const MAX_INT_PART = 100;

/** 소수점이 여러 개일 때, 정수부가 0~100 범위에 들고 소수부 자릿수가 자연스러운(4자리에 가까운) 위치를 고른다. */
function chooseBestDotSplit(digitsWithDots: string): string {
  const digitsOnly = digitsWithDots.replace(/\./g, '');
  if (!digitsOnly) return '';

  // 원래 각 '.' 앞에 있던 숫자 개수를 분할 후보 위치로 모은다.
  const candidatePositions = new Set<number>();
  let digitCount = 0;
  for (const ch of digitsWithDots) {
    if (ch === '.') candidatePositions.add(digitCount);
    else digitCount++;
  }

  let best: { pos: number; score: number } | null = null;
  for (const pos of candidatePositions) {
    if (pos <= 0 || pos >= digitsOnly.length) continue; // 맨 앞/맨 끝에 점 -> 무효 후보
    const intPart = Number(digitsOnly.slice(0, pos));
    if (Number.isNaN(intPart) || intPart < 0 || intPart > MAX_INT_PART) continue;
    const decLength = digitsOnly.length - pos;
    const score = -Math.abs(decLength - 4) + (digitsOnly.slice(0, pos).length <= 3 ? 1 : 0);
    if (!best || score > best.score) best = { pos, score };
  }

  if (!best) return digitsOnly; // 유효한 후보가 없으면 점 없이 이어붙인 값을 마지막 안전장치로 사용한다.
  return `${digitsOnly.slice(0, best.pos)}.${digitsOnly.slice(best.pos)}`;
}

/** OCR 원문(경험치 관련 부분)을 "32.4152%" 표준 형태로 정규화한다. */
export function normalizeExpValue(rawText: string): NormalizedExp {
  const digitsAndDots = rawText.replace(/[^\d.]/g, ''); // 숫자 외 문자는 제거
  if (!digitsAndDots) return { raw: '', value: null, unit: '%' };

  const dotCount = (digitsAndDots.match(/\./g) || []).length;
  const normalizedDigits = dotCount <= 1 ? digitsAndDots : chooseBestDotSplit(digitsAndDots);

  if (!normalizedDigits || normalizedDigits === '.') return { raw: '', value: null, unit: '%' };

  const value = Number(normalizedDigits);
  if (Number.isNaN(value)) return { raw: '', value: null, unit: '%' };

  return { raw: `${normalizedDigits}%`, value, unit: '%' }; // %가 없어도 항상 붙여서 반환
}

/**
 * OCR 원문에서 경험치(%)와는 별개인 "레벨로 보이는 정수"를 찾는다.
 * 경험치 숫자(소수점 포함, %가 붙는 쪽)를 먼저 제거한 뒤, 남은 텍스트에서
 * 1~3자리 정수 토큰을 찾아 레벨 후보로 추정한다. 여러 개면 첫 번째 것을 쓴다.
 * 어디까지나 "추정"이며, 실패하면 null을 반환해 수동 입력으로 넘어가게 한다.
 */
export function extractLevelCandidate(rawText: string): number | null {
  // 소수점이 포함된 숫자(경험치%로 추정되는 부분)를 먼저 제거한다.
  const withoutDecimal = rawText.replace(/\d+\.\d+/g, ' ');
  const matches = withoutDecimal.match(/\b\d{1,3}\b/g);
  if (!matches) return null;

  for (const m of matches) {
    const n = Number(m);
    if (n >= 1 && n <= 200) return n; // 리니지 클래식 레벨 범위를 넉넉하게 잡는다.
  }
  return null;
}

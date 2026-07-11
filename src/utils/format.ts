import type { NumberFormat } from '@/types';

/** 숫자를 numberFormat 설정에 따라 콤마 포함/미포함 형식으로 변환한다. */
export function formatNumber(n: number | null | undefined, format: NumberFormat = 'comma'): string {
  if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return '0';
  const rounded = Math.round(n);
  return format === 'plain' ? String(rounded) : rounded.toLocaleString('ko-KR');
}

/** 초를 "H시간 M분" 형태 문자열로 변환한다. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const s = !totalSeconds || totalSeconds < 0 || !Number.isFinite(totalSeconds) ? 0 : totalSeconds;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}시간 ${m}분`;
}

/** 경험치(%) 값을 부호 포함 문자열로 변환한다. 예: 0.8421 -> "+0.8421%" */
export function formatPercent(v: number | null | undefined, digits = 4): string {
  const n = !v || Number.isNaN(v) || !Number.isFinite(v) ? 0 : v;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

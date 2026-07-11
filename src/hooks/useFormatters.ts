import { useCallback } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { formatNumber, formatPercent, formatDuration } from '@/utils/format';

/** 현재 settings(numberFormat, decimalPlaces)를 반영한 포맷 함수들을 반환한다. */
export function useFormatters() {
  const { data } = useAppData();
  const { numberFormat, decimalPlaces } = data.settings;

  const fmtNumber = useCallback((n: number | null | undefined) => formatNumber(n, numberFormat), [numberFormat]);
  const fmtPercent = useCallback(
    (v: number | null | undefined, digits?: number) => formatPercent(v, digits ?? decimalPlaces),
    [decimalPlaces]
  );

  return { formatNumber: fmtNumber, formatPercent: fmtPercent, formatDuration };
}

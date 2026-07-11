import type { ExperienceRecord } from '@/types';

/**
 * lib/expVelocity.ts
 * 레벨별 필요 경험치 테이블은 쓰지 않는다. 모든 계산은 기록에 이미 저장된
 * gainExp(구간 동안 실제로 오른 경험치 %)를 그대로 합산하는 방식으로만 이루어진다.
 * OCR로 채워진 기록도 같은 ExperienceRecord 구조를 쓰므로 자동으로 동일하게 포함된다.
 */

function recordEndTime(r: ExperienceRecord): number {
  return new Date(`${r.endDate}T${r.endTime}`).getTime();
}

export interface VelocityWindow {
  key: '24h' | '7d' | '30d';
  label: string;
  windowDays: number;
  gainPercent: number; // 해당 기간 동안 합산된 획득 경험치(%)
  perDayRate: number; // 하루 환산 속도(%/일) — 24h는 gainPercent와 동일
  recordCount: number;
  hasData: boolean;
}

/** 지정한 기간(일) 동안 종료된 기록들의 gainExp 합계를 하루 평균으로 환산한다. */
function computeWindow(records: ExperienceRecord[], key: VelocityWindow['key'], label: string, windowDays: number): VelocityWindow {
  const now = Date.now();
  const windowStart = now - windowDays * 24 * 60 * 60 * 1000;
  const relevant = records.filter((r) => {
    const end = recordEndTime(r);
    return !Number.isNaN(end) && end >= windowStart && end <= now;
  });
  const gainPercent = relevant.reduce((sum, r) => sum + r.gainExp, 0);
  return {
    key,
    label,
    windowDays,
    gainPercent,
    perDayRate: gainPercent / windowDays,
    recordCount: relevant.length,
    hasData: relevant.length > 0,
  };
}

/** 24시간 / 7일 / 30일 세 구간의 획득 속도를 한 번에 계산한다. */
export function computeVelocityWindows(records: ExperienceRecord[]): VelocityWindow[] {
  return [
    computeWindow(records, '24h', '최근 24시간', 1),
    computeWindow(records, '7d', '최근 7일 평균', 7),
    computeWindow(records, '30d', '최근 30일 평균', 30),
  ];
}

export interface EtaResult {
  remainingPercent: number;
  days: number | null; // 속도가 0 이하라 예측 불가하면 null
  etaDate: Date | null;
}

/** 현재 경험치(%)와 하루 속도(%/일)로 100% 도달까지 남은 일수/예상 날짜를 계산한다. */
export function computeEta(currentExpPercent: number, perDayRate: number): EtaResult {
  const remainingPercent = Math.max(0, 100 - currentExpPercent);
  if (remainingPercent === 0) return { remainingPercent: 0, days: 0, etaDate: new Date() };
  if (perDayRate <= 0) return { remainingPercent, days: null, etaDate: null };

  const days = remainingPercent / perDayRate;
  const etaDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return { remainingPercent, days, etaDate };
}

/** 전체 기록 평균 (첫 기록부터 지금까지의 총 획득량 ÷ 경과 일수). 기록이 하루도 안 됐으면 총량 그대로. */
export function computeOverallAverage(records: ExperienceRecord[]): { totalGain: number; perDayRate: number; spanDays: number } {
  if (!records.length) return { totalGain: 0, perDayRate: 0, spanDays: 0 };
  const totalGain = records.reduce((sum, r) => sum + r.gainExp, 0);
  const times = records.map(recordEndTime).filter((t) => !Number.isNaN(t));
  const spanMs = times.length ? Math.max(...times) - Math.min(...times) : 0;
  const spanDays = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
  return { totalGain, perDayRate: totalGain / spanDays, spanDays };
}

export interface GoalResult {
  targetDate: Date;
  daysRemaining: number;
  requiredPerDayRate: number; // 목표일까지 필요한 하루 평균
  currentPerDayRate: number; // 현재 페이스 (최근 7일 평균 기준)
  achievable: boolean;
  shortfallPerDay: number; // achievable이 false일 때, 하루에 더 필요한 %
}

/** 목표일까지 필요한 하루 평균 속도와, 현재(최근 7일) 페이스로 달성 가능한지를 계산한다. */
export function computeGoal(currentExpPercent: number, currentPerDayRate: number, targetDateStr: string): GoalResult | null {
  const targetDate = new Date(`${targetDateStr}T23:59:59`);
  if (Number.isNaN(targetDate.getTime())) return null;

  const daysRemaining = (targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  const remainingPercent = Math.max(0, 100 - currentExpPercent);

  if (daysRemaining <= 0) {
    return { targetDate, daysRemaining, requiredPerDayRate: Infinity, currentPerDayRate, achievable: remainingPercent === 0, shortfallPerDay: 0 };
  }

  const requiredPerDayRate = remainingPercent / daysRemaining;
  const achievable = currentPerDayRate >= requiredPerDayRate;
  const shortfallPerDay = achievable ? 0 : requiredPerDayRate - currentPerDayRate;

  return { targetDate, daysRemaining, requiredPerDayRate, currentPerDayRate, achievable, shortfallPerDay };
}

export interface BestWorstStats {
  bestDay: DailyGainPoint | null;
  worstDay: DailyGainPoint | null; // 획득이 있었던 날 중 가장 적은 날 (0 획득일은 제외)
  bestWeeklyAvg: number; // 7일 구간 평균 중 최고치
  bestMonthlyAvg: number; // 30일 구간 평균 중 최고치
}

/** 최고/최저 하루 기록과, 7일/30일 구간 평균 중 가장 높았던 값을 찾는다. */
export function computeBestWorstStats(records: ExperienceRecord[], rangeDays = 90): BestWorstStats {
  const series = computeDailySeries(records, rangeDays);
  const activeDays = series.filter((p) => p.gain > 0);

  const bestDay = activeDays.length ? activeDays.reduce((a, b) => (b.gain > a.gain ? b : a)) : null;
  const worstDay = activeDays.length ? activeDays.reduce((a, b) => (b.gain < a.gain ? b : a)) : null;

  const weeklyAverages = computeMovingAverage(series, 7);
  const monthlyAverages = computeMovingAverage(series, 30);

  return {
    bestDay,
    worstDay,
    bestWeeklyAvg: weeklyAverages.length ? Math.max(...weeklyAverages) : 0,
    bestMonthlyAvg: monthlyAverages.length ? Math.max(...monthlyAverages) : 0,
  };
}

export type Trend = 'up' | 'down' | 'flat';

/** 최근 7일 이동평균이 30일 이동평균보다 높으면 증가 추세, 낮으면 감소 추세로 판단한다. */
export function computeTrend(records: ExperienceRecord[]): { trend: Trend; recentAvg: number; baselineAvg: number } {
  const series = computeDailySeries(records, 30);
  const weekly = computeMovingAverage(series, 7);
  const monthly = computeMovingAverage(series, 30);
  const recentAvg = weekly[weekly.length - 1] ?? 0;
  const baselineAvg = monthly[monthly.length - 1] ?? 0;

  const diffRatio = baselineAvg > 0 ? (recentAvg - baselineAvg) / baselineAvg : 0;
  const trend: Trend = diffRatio > 0.05 ? 'up' : diffRatio < -0.05 ? 'down' : 'flat';

  return { trend, recentAvg, baselineAvg };
}


export interface DailyGainPoint {
  date: string; // YYYY-MM-DD
  gain: number; // 그 날 종료된 기록들의 gainExp 합계
}

/** 최근 N일간 일자별 획득 경험치 합계를 만든다 (그래프의 막대 데이터). */
export function computeDailySeries(records: ExperienceRecord[], days = 30): DailyGainPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const r of records) {
    const end = new Date(recordEndTime(r));
    if (Number.isNaN(end.getTime())) continue;
    const key = end.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + r.gainExp);
  }

  return Array.from(buckets.entries()).map(([date, gain]) => ({ date, gain }));
}

/** 단순 이동평균 (그래프의 추세선용). window가 데이터 길이보다 크면 가능한 범위만큼만 평균낸다. */
export function computeMovingAverage(series: DailyGainPoint[], window: number): number[] {
  return series.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = series.slice(start, i + 1);
    const sum = slice.reduce((s, p) => s + p.gain, 0);
    return sum / slice.length;
  });
}

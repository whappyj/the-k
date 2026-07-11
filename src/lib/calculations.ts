import type { EstimateMaterial, ExperienceFormValues, CalculatorFormValues, Calculator24Status } from '@/types';
import { combineDateTime } from '@/utils/date';

/* ============================== 제작 비교 견적 ============================== */

export interface EstimateGroupResult {
  rows: { id: string; name: string; neededQty: number; unitPrice: number; cost: number }[];
  materialTotal: number;
  totalAdena: number;
  krw: number;
}

/** 한 그룹(A/B)의 재료비/제작비/원화 환산을 계산한다. 원화 = 총제작비 ÷ 환율. */
export function calcEstimateGroup(
  materials: EstimateMaterial[],
  priceKey: 'priceA' | 'priceB',
  rate: number,
  fee: number,
  qtyTier: number
): EstimateGroupResult {
  let materialTotal = 0;
  const rows = materials.map((m) => {
    const unitPrice = Number(m[priceKey]) || 0;
    const neededQty = (Number(m.qty) || 0) * qtyTier;
    const cost = unitPrice * neededQty;
    materialTotal += cost;
    return { id: m.id, name: m.name, neededQty, unitPrice, cost };
  });
  const totalAdena = materialTotal + (Number(fee) || 0) * qtyTier;
  const krw = rate > 0 ? totalAdena / rate : 0;
  return { rows, materialTotal, totalAdena, krw };
}

/* ============================== 경험치 기록 ============================== */

export interface ExperienceStats {
  totalSeconds: number;
  playTime: number;
  gainExp: number;
  expPerHour: number;
  expPerMinute: number;
  partyCount: number;
}

/** 경험치 기록 폼 값으로부터 사냥시간/획득경험치/시간당·분당 경험치를 계산한다.
 *  실제 사냥시간 = 전체 경과시간 - 마을 체류(엠탐) 시간.
 *  획득 경험치 = (종료레벨-시작레벨)×100 + 종료경험치 - 시작경험치 (리니지 클래식은 %기준이므로
 *  레벨업 1회당 100%를 새로 채우는 것과 같다 — 레벨업이 있어도 음수가 나오지 않는다). */
export function computeExperienceStats(f: ExperienceFormValues): ExperienceStats | null {
  const start = combineDateTime(f.startDate, f.startTime);
  const end = combineDateTime(f.endDate, f.endTime);
  if (!start || !end) return null;

  const totalSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  const townSeconds = Math.max(0, (Number(f.townMinutes) || 0) * 60);
  const playTime = Math.max(0, totalSeconds - townSeconds);
  const levelDiff = (Number(f.endLevel) || 0) - (Number(f.startLevel) || 0);
  const gainExp = levelDiff * 100 + (Number(f.endExp) || 0) - (Number(f.startExp) || 0);
  const hours = playTime / 3600;
  const expPerHour = hours > 0 ? gainExp / hours : 0;
  const expPerMinute = expPerHour / 60;
  const partyCount = f.knight + f.elf + f.wizard;

  return { totalSeconds, playTime, gainExp, expPerHour, expPerMinute, partyCount };
}

/** 경험치 기록 폼 유효성 검사. 통과 시 null, 실패 시 에러 메시지를 반환한다. */
export function validateExperienceForm(f: ExperienceFormValues, maxParty: number): string | null {
  if (!f.huntArea) return '사냥터를 입력해주세요.';
  if (f.startLevel === '' || Number(f.startLevel) < 1) return '시작 레벨을 입력해주세요.';
  if (f.endLevel === '' || Number(f.endLevel) < 1) return '종료 레벨을 입력해주세요.';
  if (Number(f.endLevel) < Number(f.startLevel)) return '종료 레벨은 시작 레벨보다 낮을 수 없습니다.';
  if (!f.startDate || !f.startTime || !f.endDate || !f.endTime) return '시작/종료 날짜와 시간을 입력해주세요.';
  const start = combineDateTime(f.startDate, f.startTime);
  const end = combineDateTime(f.endDate, f.endTime);
  if (!start || !end) return '날짜/시간 형식이 올바르지 않습니다.';
  if (end <= start) return '종료 시간은 시작 시간 이후여야 합니다.';
  const totalSeconds = (end.getTime() - start.getTime()) / 1000;
  if ((f.townMinutes || 0) * 60 > totalSeconds) return '마을 체류(엠탐) 시간은 전체 경과시간보다 클 수 없습니다.';
  if (f.startExp === '' || f.endExp === '') return '시작/종료 경험치를 입력해주세요.';
  if (Number(f.startExp) < 0 || Number(f.endExp) < 0) return '경험치는 음수일 수 없습니다.';
  if (Number(f.startExp) >= 100 || Number(f.endExp) >= 100) return '경험치는 100% 미만이어야 합니다.';
  // 레벨업이 없다면(시작레벨===종료레벨) 종료%가 시작%보다 낮을 수 없다.
  // 레벨업이 있었다면(종료레벨>시작레벨) 종료%가 시작%보다 낮아도 정상이다(레벨업하며 %가 초기화됐으므로).
  if (Number(f.endLevel) === Number(f.startLevel) && Number(f.endExp) < Number(f.startExp)) {
    return '레벨업이 없다면 종료 경험치는 시작 경험치보다 크거나 같아야 합니다.';
  }
  const partySum = f.knight + f.elf + f.wizard;
  if (partySum > maxParty) return `파티 인원은 최대 ${maxParty}명입니다.`;
  if (f.bibigiEnabled && f.bibigiCount > partySum) return '비비기 인원은 파티 인원을 초과할 수 없습니다.';
  return null;
}

/* ============================== 24시간 계산기 ============================== */

export interface Calculator24Core {
  start: Date;
  end: Date;
  totalHours: number;
  playHours: number;
  gainExp: number;
  hourExp: number;
  minuteExp: number;
  dayExp: number;
}

export function computeCalculatorCore(f: CalculatorFormValues): Calculator24Core | null {
  const start = combineDateTime(f.startDate, f.startTime);
  const end = combineDateTime(f.endDate, f.endTime);
  if (!start || !end) return null;

  const totalHours = (end.getTime() - start.getTime()) / 3600000;
  if (!Number.isFinite(totalHours) || totalHours <= 0) return null;

  const playHours = f.maintenanceEnabled ? Math.max(0, totalHours - f.maintenanceHours) : totalHours;
  const gainExp = (Number(f.endExp) || 0) - (Number(f.startExp) || 0);
  const hourExp = playHours > 0 ? gainExp / playHours : 0;
  const minuteExp = hourExp / 60;
  const dayExp = hourExp * 24;

  return { start, end, totalHours, playHours, gainExp, hourExp, minuteExp, dayExp };
}

export interface LevelUpPrediction {
  remainExp: number;
  remainHours: number | null;
  remainDays: number | null;
  expectedDate: Date | null;
}

export function computeLevelUp(f: CalculatorFormValues, core: Calculator24Core): LevelUpPrediction {
  const targetExp = Number(f.targetExp) || 0;
  const currentExp = Number(f.endExp) || 0;
  const remainExp = Math.max(0, targetExp - currentExp);
  const remainHours = core.hourExp > 0 ? remainExp / core.hourExp : null;
  const remainDays = remainHours !== null ? remainHours / 24 : null;
  const expectedDate = remainHours !== null ? new Date(core.end.getTime() + remainHours * 3600000) : null;
  return { remainExp, remainHours, remainDays, expectedDate };
}

export interface GoalResult {
  invalid: boolean;
  remainDays: number;
  requiredDayExp: number;
  requiredHourExp: number;
  currentHourExp: number;
  diffPercent: number;
  status: Calculator24Status;
}

export function computeGoal(f: CalculatorFormValues, core: Calculator24Core, levelUp: LevelUpPrediction): GoalResult | null {
  if (!f.targetDate) return null;
  const targetDateTime = new Date(`${f.targetDate}T23:59:59`);
  const remainHoursToTarget = (targetDateTime.getTime() - core.end.getTime()) / 3600000;
  if (remainHoursToTarget <= 0) {
    return { invalid: true, remainDays: 0, requiredDayExp: 0, requiredHourExp: 0, currentHourExp: 0, diffPercent: 0, status: null };
  }

  const remainDays = remainHoursToTarget / 24;
  const requiredDayExp = levelUp.remainExp / remainDays;
  const requiredHourExp = requiredDayExp / 24;
  const currentHourExp = core.hourExp;

  let diffPercent = 0;
  if (currentHourExp > 0) diffPercent = ((requiredHourExp - currentHourExp) / currentHourExp) * 100;
  else if (requiredHourExp > 0) diffPercent = Infinity;

  let status: Calculator24Status = 'impossible';
  if (currentHourExp <= 0) status = 'impossible';
  else if (currentHourExp >= requiredHourExp) status = 'achievable';
  else status = 'needMore';

  return { invalid: false, remainDays, requiredDayExp, requiredHourExp, currentHourExp, diffPercent, status };
}

/** 24시간 계산기 폼 유효성 검사 (저장 시점). */
export function validateCalculatorForm(f: CalculatorFormValues, core: Calculator24Core | null): string | null {
  if (!f.startDate || !f.startTime || !f.endDate || !f.endTime) return '시작/종료 날짜와 시간을 입력해주세요.';
  const start = combineDateTime(f.startDate, f.startTime);
  const end = combineDateTime(f.endDate, f.endTime);
  if (!start || !end || end <= start) return '종료 시간은 시작 시간 이후여야 합니다.';
  if (f.startExp === '' || f.endExp === '') return '시작/종료 경험치를 입력해주세요.';
  if (Number(f.endExp) < Number(f.startExp)) return '종료 경험치는 시작 경험치 이상이어야 합니다.';
  if (!core) return '계산할 수 없는 입력입니다.';
  if (f.maintenanceEnabled && f.maintenanceHours > core.totalHours) return '점검시간은 전체 경과시간보다 클 수 없습니다.';
  if (core.hourExp <= 0) return '시간당 경험치는 0보다 커야 저장할 수 있습니다.';
  return null;
}

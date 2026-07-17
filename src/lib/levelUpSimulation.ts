/**
 * lib/levelUpSimulation.ts
 * "레벨업 시뮬레이터" 전용 순수 함수. calculations.ts와는 완전히 별개이며,
 * 이미 저장된 시간당 경험치(expPerHour)에 하루하루 시간을 진행시키면서
 * 메인탐/정기점검/공성전/전투·쟁 시간을 자동으로 제외하는 단순 반복 계산만 한다.
 * 새 데이터 필드나 계산식을 calculations.ts/appDataReducer.ts에 추가하지 않는다.
 */

/** [시작시, 시작분, 종료시, 종료분] */
type Window = [number, number, number, number];

const MAINTOWN_WINDOWS: Window[] = [
  [3, 0, 3, 30],
  [9, 0, 9, 30],
  [15, 0, 15, 30],
  [21, 0, 21, 30],
];
const CHECK_WINDOW: Window = [5, 0, 10, 0]; // 수요일
const SIEGE_WINDOW: Window = [20, 0, 21, 0]; // 일요일

function atTime(day: Date, h: number, m: number): Date {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export interface SimulationResult {
  completionDate: Date;
  totalDays: number;
  maintownCount: number;
  maintownMinutes: number;
  checkCount: number;
  checkMinutes: number;
  siegeCount: number;
  siegeMinutes: number;
  battleMinutesTotal: number;
  effectiveDailyHoursAvg: number;
}

interface Interval {
  start: Date;
  end: Date;
  kind: 'maintown' | 'check' | 'siege' | 'battle';
}

/**
 * now부터 하루씩 진행시키며 remainingPercent(남은 경험치 %)를 다 채울 때까지 시뮬레이션한다.
 * 하루를 "제외 구간(메인탐/정기점검/공성전/전투·쟁)"과 "사냥 가능 구간"으로 나눠 실제 달력
 * 순서대로 걸어가며 누적 경험치를 더하고, 목표에 도달하는 정확한 순간에 멈춘다 — 그 순간
 * 이후에 놓인 제외 구간은 횟수·시간에 포함하지 않는다(아직 일어나지 않았으므로).
 */
export function simulateLevelUp(
  now: Date,
  expPerHour: number,
  remainingPercent: number,
  battleMinutesPerDay: number,
  dailyHoursCap: number
): SimulationResult | null {
  if (expPerHour <= 0 || remainingPercent <= 0) return null;
  const dailyCapMinutes = dailyHoursCap > 0 ? dailyHoursCap * 60 : Infinity;

  const dayStartOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  let totalGain = 0;
  let maintownCount = 0;
  let maintownMinutes = 0;
  let checkCount = 0;
  let checkMinutes = 0;
  let siegeCount = 0;
  let siegeMinutes = 0;
  let battleMinutesTotal = 0;
  let totalEffectiveHours = 0;

  let dayCursor = dayStartOf(now);
  const MAX_DAYS = 3650;

  for (let iter = 0; iter < MAX_DAYS; iter++) {
    const dayStart = new Date(dayCursor);
    const dayEnd = new Date(dayCursor);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const effectiveStart = iter === 0 ? now : dayStart;

    // 이 날의 모든 제외 구간을 시간순으로 나열한다 (전투/쟁은 메인탐 사이 첫 빈 시간에 배치).
    const busy: Interval[] = [];
    for (const [sh, sm, eh, em] of MAINTOWN_WINDOWS) {
      const s = atTime(dayStart, sh, sm);
      const e = atTime(dayStart, eh, em);
      if (e > effectiveStart && s < dayEnd) busy.push({ start: s, end: e, kind: 'maintown' });
    }
    if (dayStart.getDay() === 3) {
      const [sh, sm, eh, em] = CHECK_WINDOW;
      const s = atTime(dayStart, sh, sm);
      const e = atTime(dayStart, eh, em);
      if (e > effectiveStart && s < dayEnd) busy.push({ start: s, end: e, kind: 'check' });
    }
    if (dayStart.getDay() === 0) {
      const [sh, sm, eh, em] = SIEGE_WINDOW;
      const s = atTime(dayStart, sh, sm);
      const e = atTime(dayStart, eh, em);
      if (e > effectiveStart && s < dayEnd) busy.push({ start: s, end: e, kind: 'siege' });
    }
    busy.sort((a, b) => a.start.getTime() - b.start.getTime());

    // 전투/쟁 시간을 하루 중 가장 이른 빈 시간에 배치한다(그날 자유시간이 부족하면 남는 만큼만).
    if (battleMinutesPerDay > 0) {
      let remainingBattle = battleMinutesPerDay;
      let cursor = effectiveStart;
      const merged: Interval[] = [];
      for (const b of busy) {
        if (remainingBattle > 0 && b.start > cursor) {
          const gapMin = (b.start.getTime() - cursor.getTime()) / 60000;
          const use = Math.min(gapMin, remainingBattle);
          if (use > 0) {
            const battleEnd = new Date(cursor.getTime() + use * 60000);
            merged.push({ start: new Date(cursor), end: battleEnd, kind: 'battle' });
            remainingBattle -= use;
          }
        }
        merged.push(b);
        if (b.end > cursor) cursor = b.end;
      }
      if (remainingBattle > 0 && cursor < dayEnd) {
        const gapMin = (dayEnd.getTime() - cursor.getTime()) / 60000;
        const use = Math.min(gapMin, remainingBattle);
        if (use > 0) {
          merged.push({ start: new Date(cursor), end: new Date(cursor.getTime() + use * 60000), kind: 'battle' });
        }
      }
      busy.length = 0;
      busy.push(...merged.sort((a, b) => a.start.getTime() - b.start.getTime()));
    }

    // 빈 구간(사냥 가능 시간)을 순서대로 걸으며 누적, 목표 도달 순간 정확히 멈춘다.
    // 단, 하루 사냥시간 상한(dailyHoursCap)에 도달하면 그날 나머지는 사냥하지 않은 것으로 본다.
    let cursor = effectiveStart;
    let usedTodayMinutes = 0;
    let dayCapped = false;
    for (const b of busy) {
      if (!dayCapped && b.start > cursor) {
        const gapMinutes = (b.start.getTime() - cursor.getTime()) / 60000;
        const usableMinutes = Math.min(gapMinutes, Math.max(0, dailyCapMinutes - usedTodayMinutes));
        if (usableMinutes > 0) {
          const freeHours = usableMinutes / 60;
          const gain = freeHours * expPerHour;
          if (totalGain + gain >= remainingPercent) {
            const neededHours = (remainingPercent - totalGain) / expPerHour;
            const completionDate = new Date(cursor.getTime() + neededHours * 3600000);
            totalEffectiveHours += neededHours;
            return {
              completionDate,
              totalDays: iter + 1,
              maintownCount,
              maintownMinutes,
              checkCount,
              checkMinutes,
              siegeCount,
              siegeMinutes,
              battleMinutesTotal,
              effectiveDailyHoursAvg: totalEffectiveHours / (iter + 1),
            };
          }
          totalGain += gain;
          totalEffectiveHours += freeHours;
          usedTodayMinutes += usableMinutes;
        }
        if (usedTodayMinutes >= dailyCapMinutes) dayCapped = true;
      }
      if (dayCapped) break;
      // 이 제외 구간을 실제로 "통과"하므로 카운트에 반영한다.
      const durMin = (b.end.getTime() - b.start.getTime()) / 60000;
      if (b.kind === 'maintown') {
        maintownCount += 1;
        maintownMinutes += durMin;
      } else if (b.kind === 'check') {
        checkCount += 1;
        checkMinutes += durMin;
      } else if (b.kind === 'siege') {
        siegeCount += 1;
        siegeMinutes += durMin;
      } else {
        battleMinutesTotal += durMin;
      }
      if (b.end > cursor) cursor = b.end;
    }

    // 하루의 마지막 빈 구간(마지막 제외 구간 이후 ~ 자정까지)
    if (!dayCapped && dayEnd > cursor) {
      const gapMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000;
      const usableMinutes = Math.min(gapMinutes, Math.max(0, dailyCapMinutes - usedTodayMinutes));
      if (usableMinutes > 0) {
        const freeHours = usableMinutes / 60;
        const gain = freeHours * expPerHour;
        if (totalGain + gain >= remainingPercent) {
          const neededHours = (remainingPercent - totalGain) / expPerHour;
          const completionDate = new Date(cursor.getTime() + neededHours * 3600000);
          totalEffectiveHours += neededHours;
          return {
            completionDate,
            totalDays: iter + 1,
            maintownCount,
            maintownMinutes,
            checkCount,
            checkMinutes,
            siegeCount,
            siegeMinutes,
            battleMinutesTotal,
            effectiveDailyHoursAvg: totalEffectiveHours / (iter + 1),
          };
        }
        totalGain += gain;
        totalEffectiveHours += freeHours;
      }
    }

    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return null;
}

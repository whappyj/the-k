import type { ExperienceRecord } from '@/types';

export interface GroupStats {
  key: string;
  count: number;
  avgPerHour: number;
  bestPerHour: number;
  avgPlayTime: number;
  avgGainExp: number;
  list: ExperienceRecord[];
}

/** 레코드 목록의 통계(평균/최고/평균사냥시간/기록수/평균획득경험치)를 계산한다. */
export function computeStats(list: ExperienceRecord[]): Omit<GroupStats, 'key' | 'list'> {
  const count = list.length;
  if (!count) return { count: 0, avgPerHour: 0, bestPerHour: 0, avgPlayTime: 0, avgGainExp: 0 };
  let sumPerHour = 0;
  let best = -Infinity;
  let sumPlayTime = 0;
  let sumGain = 0;
  for (const r of list) {
    sumPerHour += r.expPerHour;
    if (r.expPerHour > best) best = r.expPerHour;
    sumPlayTime += r.playTime;
    sumGain += r.gainExp;
  }
  return { count, avgPerHour: sumPerHour / count, bestPerHour: best, avgPlayTime: sumPlayTime / count, avgGainExp: sumGain / count };
}

export function groupBy(records: ExperienceRecord[], keyFn: (r: ExperienceRecord) => string): GroupStats[] {
  const map = new Map<string, ExperienceRecord[]>();
  records.forEach((r) => {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return Array.from(map.entries()).map(([key, list]) => ({ key, list, ...computeStats(list) }));
}

export type SortMode = 'avg' | 'best' | 'count' | 'time';

export function sortGroups(groups: GroupStats[], mode: SortMode): GroupStats[] {
  const sorters: Record<SortMode, (a: GroupStats, b: GroupStats) => number> = {
    avg: (a, b) => b.avgPerHour - a.avgPerHour,
    best: (a, b) => b.bestPerHour - a.bestPerHour,
    count: (a, b) => b.count - a.count,
    time: (a, b) => b.avgPlayTime - a.avgPlayTime,
  };
  return [...groups].sort(sorters[mode]);
}

/** 사냥 조건을 "일반/몰이/비비기/비비기+몰이"로 단순화한 라벨을 만든다 (카드형 비교용). */
function comboLabel(r: ExperienceRecord): string {
  if (r.bibigi.enabled && r.molly) return '비비기+몰이';
  if (r.bibigi.enabled) return '비비기';
  if (r.molly) return '몰이';
  return '일반';
}

export interface ComboSummary {
  label: string;
  per30min: number;
  count: number;
}

export type AreaRank = 'best' | 'second' | 'worst' | 'normal';

export interface AreaCardData {
  huntArea: string;
  combos: ComboSummary[]; // per30min 내림차순
  best30min: number;
  rank: AreaRank;
  /** 1위 카드에서만 채워진다: 2위 사냥터 대비 몇 % 더 좋은지. */
  diffFromNext: number | null;
}

/**
 * 사냥터별로 "어떤 조합이 가장 좋은지 / 사냥터끼리 비교하면 어디가 제일 좋은지"를
 * 카드 UI로 바로 렌더링할 수 있는 형태로 계산한다. 그래프는 전혀 쓰지 않고,
 * 모든 값은 "30분 기준 %"로 통일해 사냥터 간 직관적으로 비교할 수 있게 한다.
 */
export function computeHuntAreaCards(records: ExperienceRecord[]): AreaCardData[] {
  const areaGroups = groupBy(records, (r) => r.huntArea);

  const cards = areaGroups.map((areaGroup) => {
    const comboGroups = groupBy(areaGroup.list, comboLabel);
    const combos: ComboSummary[] = comboGroups
      .map((g) => ({ label: g.key, per30min: g.avgPerHour / 2, count: g.count }))
      .sort((a, b) => b.per30min - a.per30min);
    return { huntArea: areaGroup.key, combos, best30min: combos[0]?.per30min ?? 0 };
  });

  const sorted = [...cards].sort((a, b) => b.best30min - a.best30min);

  return cards
    .map((c) => {
      const rankIndex = sorted.findIndex((s) => s.huntArea === c.huntArea);
      let rank: AreaRank = 'normal';
      let diffFromNext: number | null = null;

      if (sorted.length >= 2) {
        if (rankIndex === 0) {
          rank = 'best';
          const next = sorted[1]!;
          diffFromNext = next.best30min > 0 ? ((c.best30min - next.best30min) / next.best30min) * 100 : null;
        } else if (rankIndex === 1) {
          rank = 'second';
        }
        if (rankIndex === sorted.length - 1 && rankIndex !== 0) rank = 'worst';
      }

      return { ...c, rank, diffFromNext };
    })
    .sort((a, b) => b.best30min - a.best30min);
}

import { useMemo, useState } from 'react';
import { Search, Star, ArrowLeft, MapPin } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { useHuntAreaFavorites } from '@/hooks/useHuntAreaFavorites';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_HUNT_AREA_EFFICIENCY } from '@/lib/helpContent';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyCell, EmptyState } from '@/components/common/EmptyState';
import type { ExperienceRecord } from '@/types';
import { cn } from '@/utils/cn';

type SortMode = 'avg' | 'recent' | 'name' | 'count';

interface AreaStat {
  area: string;
  count: number;
  avgPerHour: number;
  bestPerHour: number;
  worstPerHour: number;
  latestPerHour: number;
  latestAt: number; // timestamp, for recent 정렬
  records: ExperienceRecord[];
}

/** 사냥터별로 측정횟수/평균/최고/최저/최근 시간당 경험치를 계산한다.
 *  전부 이미 저장된 expPerHour 값을 단순 집계한 것뿐 — 새 계산식은 없다. */
function computeAreaStats(records: ExperienceRecord[]): AreaStat[] {
  const map = new Map<string, ExperienceRecord[]>();
  for (const r of records) {
    if (!map.has(r.huntArea)) map.set(r.huntArea, []);
    map.get(r.huntArea)!.push(r);
  }

  return Array.from(map.entries()).map(([area, list]) => {
    const sortedByDate = [...list].sort(
      (a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime()
    );
    const latest = sortedByDate[0];
    const rates = list.map((r) => r.expPerHour);
    return {
      area,
      count: list.length,
      avgPerHour: rates.reduce((s, v) => s + v, 0) / rates.length,
      bestPerHour: Math.max(...rates),
      worstPerHour: Math.min(...rates),
      latestPerHour: latest?.expPerHour ?? 0,
      latestAt: latest ? new Date(`${latest.startDate}T${latest.startTime}`).getTime() : 0,
      records: sortedByDate,
    };
  });
}

/**
 * pages/HuntAreaEfficiency.tsx ("사냥터 효율")
 * 기존 경험치 기록(experienceRecords)을 사냥터별로 묶어 측정횟수/평균/최고/최저/최근
 * 시간당 경험치를 표로 보여준다. 새 기록 방식이나 새 데이터 필드를 추가하지 않고,
 * 이미 저장된 huntArea/expPerHour만 집계한다. 즐겨찾기는 별도 LocalStorage 키로 관리해
 * 기존 앱 데이터 구조에는 전혀 영향이 없다.
 */
export function HuntAreaEfficiencyPage() {
  const { data } = useAppData();
  const { formatPercent, formatDuration } = useFormatters();
  const { favorites, toggleFavorite, isFavorite } = useHuntAreaFavorites();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('avg');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const records = data.experienceRecords;
  const allStats = useMemo(() => computeAreaStats(records), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? allStats.filter((s) => s.area.toLowerCase().includes(q)) : allStats;
    const sorted = [...list].sort((a, b) => {
      switch (sortMode) {
        case 'avg':
          return b.avgPerHour - a.avgPerHour;
        case 'recent':
          return b.latestAt - a.latestAt;
        case 'name':
          return a.area.localeCompare(b.area, 'ko');
        case 'count':
          return b.count - a.count;
        default:
          return 0;
      }
    });
    // 즐겨찾기는 정렬 기준과 무관하게 항상 최상단
    const favList = sorted.filter((s) => favorites.has(s.area));
    const restList = sorted.filter((s) => !favorites.has(s.area));
    return [...favList, ...restList];
  }, [allStats, search, sortMode, favorites]);

  const selected = selectedArea ? allStats.find((s) => s.area === selectedArea) ?? null : null;

  if (!records.length) {
    return (
      <div id="page-hunt-area-efficiency">
        <PageHeader title="🗺 사냥터 효율" actions={<HelpButton content={HELP_HUNT_AREA_EFFICIENCY} />} />
        <EmptyState icon={MapPin} title="사냥터 기록이 없습니다" description="경험치 기록이 쌓이면 사냥터별 효율을 비교할 수 있습니다." />
      </div>
    );
  }

  if (selected) {
    return (
      <div id="page-hunt-area-efficiency">
        <PageHeader
          title={`🗺 ${selected.area}`}
          subtitle={`측정 ${selected.count}회 · 평균 ${formatPercent(selected.avgPerHour)}/h`}
          actions={
            <button
              type="button"
              onClick={() => setSelectedArea(null)}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1D2530] bg-white/[0.02] px-4 text-[13px] font-semibold text-text-sub transition-colors hover:bg-white/[0.05]"
            >
              <ArrowLeft size={16} />
              목록으로
            </button>
          }
        />

        <Card className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#1D2530] text-left text-[12px] text-text-faint">
                  <th className="px-4 py-2.5 font-semibold">날짜</th>
                  <th className="px-4 py-2.5 font-semibold">시작레벨</th>
                  <th className="px-4 py-2.5 font-semibold">종료레벨</th>
                  <th className="px-4 py-2.5 font-semibold">사냥시간</th>
                  <th className="px-4 py-2.5 text-right font-semibold">경험치(%/h)</th>
                  <th className="px-4 py-2.5 font-semibold">메모</th>
                </tr>
              </thead>
              <tbody>
                {selected.records.map((r) => (
                  <tr key={r.id} className="border-b border-[#1D2530] last:border-none">
                    <td className="px-4 py-2.5 text-text-sub">{r.startDate}</td>
                    <td className="px-4 py-2.5">Lv {r.startLevel}</td>
                    <td className="px-4 py-2.5">Lv {r.endLevel}</td>
                    <td className="px-4 py-2.5 text-text-sub">{formatDuration(r.playTime)}</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-primary">{formatPercent(r.expPerHour)}/h</td>
                    <td className="max-w-[220px] break-words px-4 py-2.5 text-text-faint">{r.memo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div id="page-hunt-area-efficiency">
      <PageHeader title="🗺 사냥터 효율" actions={<HelpButton content={HELP_HUNT_AREA_EFFICIENCY} />} />

      <Card className="mb-8 flex flex-col gap-4 p-6 min-[720px]:flex-row min-[720px]:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <Input className="pl-10" placeholder="사냥터 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="min-[720px]:w-[220px]">
          <option value="avg">평균 경험치 높은 순</option>
          <option value="recent">최근 측정 순</option>
          <option value="name">사냥터 이름순</option>
          <option value="count">측정횟수순</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyCell>검색 결과가 없습니다.</EmptyCell>
      ) : (
        <Card className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#1D2530] text-left text-[12px] text-text-faint">
                  <th className="px-4 py-2.5 font-semibold">사냥터</th>
                  <th className="px-4 py-2.5 text-right font-semibold">측정횟수</th>
                  <th className="px-4 py-2.5 text-right font-semibold">평균(%/h)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">최고(%/h)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">최저(%/h)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">최근(%/h)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.area} className="cursor-pointer border-b border-[#1D2530] last:border-none hover:bg-white/[0.045]" onClick={() => setSelectedArea(s.area)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(s.area);
                          }}
                          aria-label={isFavorite(s.area) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                          className="shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-70"
                        >
                          <Star size={16} className={cn(isFavorite(s.area) ? 'fill-primary text-primary' : 'text-text-faint')} />
                        </button>
                        <span className="font-bold text-white">{s.area}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-text-sub">{s.count}회</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-primary">{formatPercent(s.avgPerHour)}</td>
                    <td className="px-4 py-2.5 text-right text-success">{formatPercent(s.bestPerHour)}</td>
                    <td className="px-4 py-2.5 text-right text-danger">{formatPercent(s.worstPerHour)}</td>
                    <td className="px-4 py-2.5 text-right text-text-sub">{formatPercent(s.latestPerHour)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

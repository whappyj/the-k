import { useState } from 'react';
import { Trophy, Sword, Shield as ShieldIcon, GitCompareArrows } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useFormatters } from '@/hooks/useFormatters';
import { PageHeader, Section } from '@/components/layout/PageHeader';
import { Card, Panel } from '@/components/ui/card';
import { EmptyCell } from '@/components/common/EmptyState';
import { groupBy, sortGroups, type GroupStats } from '@/lib/analysis';
import { BestCondition } from '@/components/analysis/BestCondition';
import { ExpMultiplierSimulator } from '@/components/analysis/ExpMultiplierSimulator';
import { ExpGoalCard } from '@/components/analysis/ExpGoalCard';
import { ExpSimulator } from '@/components/analysis/ExpSimulator';
import { RecordVsRecord } from '@/components/compare/RecordVsRecord';
import { cn } from '@/utils/cn';

const COLORS = ['#4F8CFF', '#2ECC71', '#A855F7', '#F39C12', '#EF4444'];

/**
 * pages/Compare.tsx
 * "비교" 화면 — 게임 전적 비교(랭킹전) 느낌으로 재설계.
 * 1위는 전용 Champion Hero 카드(전체 폭), 2~3위는 Silver/Bronze 러너업 카드(2열),
 * 4위 이하는 컴팩트 랭킹 리스트로 — TOP3가 구조적으로 완전히 다른 카드가 되도록 했다.
 * 그룹핑(groupBy)·평균 계산(sortGroups)은 기존 함수 그대로 재사용하며, 파티/몰이/비비기
 * 비율도 이미 저장된 기록에서 평균/비율만 낸 것 — 새 계산식은 없다.
 */
export function ComparePage() {
  const { data } = useAppData();
  const { formatPercent } = useFormatters();
  const records = data.experienceRecords;
  const [mode, setMode] = useState<'area' | 'record'>('area');

  if (!records.length) {
    return (
      <div id="page-compare">
        <PageHeader title="⚖ 비교" subtitle="사냥터별 시간당 경험치를 한눈에 비교합니다." />
        <EmptyCell>경험치 기록이 쌓이면 사냥터별 효율을 랭킹으로 비교할 수 있습니다.</EmptyCell>
      </div>
    );
  }

  const groups = sortGroups(groupBy(records, (r) => r.huntArea), 'avg');
  const champion = groups[0];
  const runnerUps = groups.slice(1, 3);
  const latest = [...records].sort(
    (a, b) => new Date(`${b.endDate}T${b.endTime}`).getTime() - new Date(`${a.endDate}T${a.endTime}`).getTime()
  )[0];
  const rest = groups.slice(3);
  const maxRate = champion?.avgPerHour ?? 1;

  const partyStats = (g: GroupStats) => {
    const n = g.list.length;
    return {
      knight: Math.round(g.list.reduce((s, r) => s + r.party.knight, 0) / n),
      elf: Math.round(g.list.reduce((s, r) => s + r.party.elf, 0) / n),
      wizard: Math.round(g.list.reduce((s, r) => s + r.party.wizard, 0) / n),
      mollyPct: Math.round((g.list.filter((r) => r.molly).length / n) * 100),
      bibigiPct: Math.round((g.list.filter((r) => r.bibigi.enabled).length / n) * 100),
      avgLevel: Math.round(g.list.reduce((s, r) => s + r.startLevel, 0) / n),
    };
  };

  return (
    <div id="page-compare">
      <PageHeader title="⚖ 비교" subtitle={`사냥터 랭킹전 — ${groups.length}개 사냥터 · 어디가 가장 효율 좋은지 3초 안에 확인하세요.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
        <ModeTab active={mode === 'area'} icon={Sword} label="사냥터 비교" desc="사냥터별 랭킹으로 비교" onClick={() => setMode('area')} />
        <ModeTab active={mode === 'record'} icon={GitCompareArrows} label="기록 vs 기록" desc="기록 두 개를 골라 직접 비교" onClick={() => setMode('record')} />
      </div>

      {mode === 'record' ? (
        <RecordVsRecord records={records} />
      ) : (
        <>

      {/* 1위: Champion Hero — 전체 폭, 완전히 다른 레이아웃 */}
      {champion && (() => {
        const s = partyStats(champion);
        return (
          <Card className="relative mb-5 overflow-hidden border-gold/55 bg-gradient-to-br from-gold-dim via-[#0B1016] to-[#0B1016] p-8 shadow-[0_0_0_1px_rgba(214,168,79,0.3),0_16px_40px_rgba(214,168,79,0.18)] sm:p-10">
            <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 text-[12px] font-extrabold tracking-wide text-[#1A1408]">
              <Trophy size={15} />
              CHAMPION
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-8 max-[900px]:grid-cols-1">
              <div className="text-center">
                <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gold/80">1위 사냥터</div>
                <div className="mb-1 text-[30px] font-bold text-white">{champion.key}</div>
                <div className="font-display text-[72px] font-bold leading-none text-gold">
                  {formatPercent(champion.avgPerHour)}
                  <span className="text-[26px] text-gold/70">/h</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3">
                <ChampionStat label="평균 레벨" value={`Lv ${s.avgLevel}`} />
                <ChampionStat label="평균 사냥시간" value={`${Math.round(champion.avgPlayTime / 60)}분`} />
                <ChampionStat label="기록 수" value={`${champion.count}건`} />
                <ChampionStat label="파티 (기사/요정/법사)" value={`${s.knight}/${s.elf}/${s.wizard}`} />
                <ChampionStat label="몰이 사용률" value={`${s.mollyPct}%`} />
                <ChampionStat label="비비기 사용률" value={`${s.bibigiPct}%`} />
              </div>
            </div>
          </Card>
        );
      })()}

      {/* 2~3위: 러너업 카드 */}
      {runnerUps.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-5 max-[720px]:grid-cols-1">
          {runnerUps.map((g, idx) => {
            const rank = idx + 2;
            const s = partyStats(g);
            const diffPct = maxRate > 0 ? ((g.avgPerHour - maxRate) / maxRate) * 100 : 0;
            const medal = rank === 2 ? { bg: 'bg-[#B9C1CC]', text: 'text-[#1A1D22]', border: 'border-[#B9C1CC]/45' } : { bg: 'bg-[#C98A4B]', text: 'text-[#1A1408]', border: 'border-[#C98A4B]/45' };
            return (
              <Card key={g.key} className={cn('relative flex flex-col', medal.border)}>
                <span className={cn('absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0B1016] font-display text-[12px] font-extrabold', medal.bg, medal.text)}>
                  {rank}
                </span>
                <div className="mb-2 flex items-center gap-2">
                  {rank === 2 ? <ShieldIcon size={15} className="text-[#B9C1CC]" /> : <Sword size={15} className="text-[#C98A4B]" />}
                  <span className="text-[15px] font-bold">{g.key}</span>
                </div>
                <div className="mb-3 font-display text-[30px] font-bold leading-none text-white">
                  {formatPercent(g.avgPerHour)}
                  <span className="text-[14px] text-text-faint">/h</span>
                </div>
                <div className={cn('mb-3 text-[12px] font-bold', diffPct < 0 ? 'text-danger' : 'text-success')}>
                  {diffPct < 0 ? '▼ ' : '▲ '}
                  {diffPct > 0 ? '+' : ''}
                  {diffPct.toFixed(0)}% (1위 대비)
                </div>
                <div className="mt-auto grid grid-cols-4 gap-2 border-t border-[#1D2530] pt-3 text-center text-[10px] text-text-faint">
                  <div>
                    <div className="font-display text-[12px] font-bold text-white">Lv {s.avgLevel}</div>
                    <div>레벨</div>
                  </div>
                  <div>
                    <div className="font-display text-[12px] font-bold text-white">
                      {s.knight}/{s.elf}/{s.wizard}
                    </div>
                    <div>파티</div>
                  </div>
                  <div>
                    <div className="font-display text-[12px] font-bold text-white">{s.mollyPct}%</div>
                    <div>몰이</div>
                  </div>
                  <div>
                    <div className="font-display text-[12px] font-bold text-white">{s.bibigiPct}%</div>
                    <div>비비기</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4위 이하: 컴팩트 랭킹 리스트 */}
      {rest.length > 0 && (
        <Card className="mb-6">
          <div className="mb-4 text-[13px] font-bold text-text-sub">전체 순위</div>
          <div className="flex flex-col gap-2">
            {rest.map((g, idx) => {
              const rank = idx + 4;
              return (
                <div key={g.key} className="flex items-center gap-3 rounded-xl border border-[#1D2530] bg-white/[0.02] px-4 py-3">
                  <span className="w-7 shrink-0 text-center font-display text-[13px] font-bold text-text-faint">{rank}</span>
                  <span className="w-32 shrink-0 truncate text-[13px] font-semibold">{g.key}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(4, (g.avgPerHour / maxRate) * 100)}%`, background: COLORS[idx % COLORS.length] }} />
                  </div>
                  <span className="w-20 shrink-0 text-right font-display text-[13px] font-bold">{formatPercent(g.avgPerHour)}/h</span>
                  <span className="w-14 shrink-0 text-right text-[11px] text-text-faint">{g.count}건</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Panel title="사냥터별 시간당 경험치 (보조 그래프)" accent="blue">
        <div className="flex flex-col gap-3">
          {groups.map((g, i) => (
            <div key={g.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[12.5px] text-text-sub">{g.key}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, (g.avgPerHour / maxRate) * 100)}%`, background: g.key === champion?.key ? '#D6A84F' : COLORS[i % COLORS.length] }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-display text-[12.5px] font-bold">{formatPercent(g.avgPerHour)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Section title="🎯 추천 사냥터">
        <BestCondition records={records} />
      </Section>

      <Section title="🧮 30분 결과로 시간대별 예상치 계산 (24시간 계산기)">
        <ExpMultiplierSimulator />
      </Section>

      <Section title="🏁 목표 달성 계산">
        <ExpGoalCard records={records} currentExpPercent={latest?.endExp ?? 0} />
      </Section>

      <Section title="🔮 목표 경험치까지 남은 시간">
        <ExpSimulator records={records} />
      </Section>
        </>
      )}
    </div>
  );
}

function ModeTab({ active, icon: Icon, label, desc, onClick }: { active: boolean; icon: typeof Sword; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
        active ? 'border-gold/50 bg-gold-dim' : 'border-[#1D2530] bg-[#0B1016] hover:bg-white/[0.03]'
      )}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-gold text-[#1A1408]' : 'bg-white/[0.06] text-text-sub')}>
        <Icon size={18} />
      </span>
      <div>
        <div className={cn('text-[14px] font-bold', active ? 'text-gold' : 'text-white')}>{label}</div>
        <div className="text-[11px] text-text-faint">{desc}</div>
      </div>
    </button>
  );
}

function ChampionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-3.5 text-center">
      <div className="mb-1 text-[10.5px] text-text-sub">{label}</div>
      <div className="font-display text-[16px] font-bold text-white">{value}</div>
    </div>
  );
}

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import type { PurchaseSettings } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

interface PurchaseHeroCardsProps {
  settings: PurchaseSettings;
  onChange: (patch: Partial<PurchaseSettings>) => void;
}

/** 만 단위로 저장된 수량을 실제 아데나 개수로 표시한다 (표시 전용 변환 — 저장값/계산식은 그대로). */
function toAdena(manUnit: number): number {
  return manUnit * 10000;
}

/**
 * components/adena/PurchaseHeroCards.tsx
 * "오늘 현황"을 방송 송출용 Apple 스타일 카드로 보여준다.
 * 계산식(환율×현재수량, 목표-현재, 진행률)은 기존 그대로이며, 이 컴포넌트는 오직 표시 방식만 바꾼다.
 *
 * 레이아웃: 데스크톱에서는 2x2 그리드(환율 · 카카오ID / 현재매입 · 목표아데나)로 네 카드의
 * 높이를 모두 맞추고, 모바일에서는 같은 순서로 세로 스택된다. 환율 카드는 카드 높이 자체는
 * 동일하게 유지하되, 옅은 블루 톤과 가장 큰 숫자로 "가장 강조"라는 요구를 만족시킨다.
 */
export function PurchaseHeroCards({ settings, onChange }: PurchaseHeroCardsProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const rateNum = Number(settings.rate) || 0;
  const targetNum = Number(settings.targetAmount) || 0;
  const currentNum = Number(settings.currentAmount) || 0;
  const remainingNum = Math.max(0, targetNum - currentNum);
  const liveTotal = rateNum * currentNum;
  const progress = targetNum > 0 ? Math.min(100, Math.round((currentNum / targetNum) * 100)) : 0;

  const handleCopyKakaoId = async () => {
    const id = settings.kakaoId?.trim();
    if (!id) return showToast('복사할 카카오톡 ID가 없습니다.', 'danger');
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      showToast('✓ 복사 완료', 'success', 2000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해주세요.', 'danger');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 min-[760px]:grid-cols-2">
        {/* ① 현재 환율 — 화면에서 가장 강조 (가장 큰 숫자 + 블루 톤) */}
        <HeroCard emphasis>
          <FieldLabel>현재 환율</FieldLabel>
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-end gap-3">
              <HeroNumberInput value={settings.rate} onChange={(v) => onChange({ rate: v })} placeholder="0" />
              <span className="pb-2 text-2xl font-semibold text-text-sub sm:pb-3 sm:text-3xl">원</span>
            </div>
          </div>
          <div className="text-[13px] text-text-faint">1만 아데나 기준</div>
        </HeroCard>

        {/* ② 카카오톡 ID — 더 큰 복사 버튼 */}
        <HeroCard>
          <FieldLabel>카카오톡 ID</FieldLabel>
          <div className="flex flex-1 flex-col justify-center gap-3">
            <Input
              value={settings.kakaoId}
              placeholder="예: theK_kakao"
              onChange={(e) => onChange({ kakaoId: e.target.value })}
              className="h-16 rounded-2xl border-transparent bg-white/[0.05] px-5 font-display text-2xl font-bold tracking-tight focus:border-primary/60 sm:text-3xl"
            />
            <button
              type="button"
              onClick={handleCopyKakaoId}
              aria-label="카카오톡 ID 복사"
              className={cn(
                'flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold transition-all duration-200 active:scale-[0.98]',
                copied ? 'bg-success/15 text-success' : 'bg-primary text-white hover:opacity-90'
              )}
            >
              {copied ? <Check size={22} /> : <Copy size={22} />}
              {copied ? '복사 완료' : '복사'}
            </button>
          </div>
        </HeroCard>

        {/* ③ 현재 매입 — 매우 큰 숫자 + 괄호 원화(작게, 회색) */}
        <HeroCard>
          <FieldLabel>현재 매입</FieldLabel>
          <div className="flex flex-1 flex-col justify-center">
            <div className="font-display text-[46px] font-bold leading-none tracking-tight text-text sm:text-[64px]">
              {toAdena(currentNum).toLocaleString('ko-KR')}
              <span className="ml-2 text-2xl font-semibold text-primary sm:text-3xl">A</span>
            </div>
            <div className="mt-3 text-base font-medium text-text-faint sm:text-lg">({liveTotal.toLocaleString('ko-KR')}원)</div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border/[0.08] pt-4">
            <Label className="text-[12px]">현재 수량 (만)</Label>
            <Input
              type="number"
              min={0}
              value={settings.currentAmount || ''}
              placeholder="0"
              onChange={(e) => onChange({ currentAmount: Number(e.target.value) || 0 })}
              className="h-11 max-w-[240px] rounded-xl border-transparent bg-white/[0.05]"
            />
          </div>
        </HeroCard>

        {/* ④ 목표 아데나 — 목표 / 남은 / 진행률 재배치 */}
        <HeroCard>
          <FieldLabel>목표 아데나</FieldLabel>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <StatRow label="목표" value={`${toAdena(targetNum).toLocaleString('ko-KR')}`} unit="A" primary />
            <div className="grid grid-cols-2 gap-4">
              <StatRow label="남은" value={`${toAdena(remainingNum).toLocaleString('ko-KR')}`} unit="A" compact />
              <div>
                <div className="text-[12px] font-semibold text-text-faint">진행률</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-primary sm:text-3xl">{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border/[0.08] pt-4">
            <Label className="text-[12px]">목표 수량 (만)</Label>
            <Input
              type="number"
              min={0}
              value={settings.targetAmount || ''}
              placeholder="0"
              onChange={(e) => onChange({ targetAmount: Number(e.target.value) || 0 })}
              className="h-11 max-w-[240px] rounded-xl border-transparent bg-white/[0.05]"
            />
          </div>
        </HeroCard>
      </div>

      {/* 메모 — 부가 정보, 눈에 덜 띄게 하단에 유지 */}
      <details className="group rounded-2xl border border-border/[0.08] bg-card-secondary px-5 py-4 open:pb-5">
        <summary className="cursor-pointer list-none text-[13px] font-semibold text-text-sub marker:content-none">
          메모 {settings.memo ? <span className="font-normal text-text-faint">· {settings.memo.slice(0, 20)}{settings.memo.length > 20 ? '…' : ''}</span> : null}
        </summary>
        <Textarea
          value={settings.memo}
          placeholder="선택 사항"
          onChange={(e) => onChange({ memo: e.target.value })}
          className="mt-3 rounded-xl border-transparent bg-white/[0.05]"
        />
      </details>
    </div>
  );
}

/** 방송용 히어로 카드 — 진한 회색 배경(Glass 없음), 24px 라운드, 은은한 그림자, 넉넉한 여백.
 *  모든 카드가 동일한 최소 높이를 공유해 2x2 그리드에서 높이가 맞춰진다. */
function HeroCard({ children, emphasis }: { children: ReactNode; emphasis?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-[300px] flex-col gap-3 rounded-[24px] border border-border/[0.08] p-7 shadow-soft sm:h-[380px] sm:p-8',
        emphasis ? 'bg-primary/[0.08]' : 'bg-card-secondary'
      )}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">{children}</div>;
}

/** 목표/남은처럼 라벨+숫자+단위로 구성된 보조 통계 한 줄. */
function StatRow({ label, value, unit, primary, compact }: { label: string; value: string; unit: string; primary?: boolean; compact?: boolean }) {
  return (
    <div>
      <div className="text-[12px] font-semibold text-text-faint">{label}</div>
      <div
        className={cn(
          'font-display font-bold leading-none tracking-tight text-text',
          primary ? 'mt-1 text-[34px] sm:text-[46px]' : compact ? 'mt-1 text-xl sm:text-2xl' : 'mt-1 text-2xl sm:text-3xl'
        )}
      >
        {value}
        <span className={cn('ml-1.5 font-semibold text-text-sub', primary ? 'text-lg sm:text-xl' : 'text-sm sm:text-base')}>{unit}</span>
      </div>
    </div>
  );
}

/** 환율처럼 "가장 크게" 강조해야 하는 값의 입력창. 숫자 입력이면서도 히어로 타이포를 유지한다. */
function HeroNumberInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder: string }) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={cn(
        'w-full min-w-0 flex-1 rounded-2xl border-none bg-transparent font-display font-bold tracking-tight text-text outline-none placeholder:text-text-faint',
        'focus:ring-0 text-[64px] leading-none sm:text-[88px]'
      )}
    />
  );
}

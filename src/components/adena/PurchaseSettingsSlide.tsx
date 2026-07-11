import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PurchaseSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { PurchaseHeroCards } from '@/components/adena/PurchaseHeroCards';
import { cn } from '@/utils/cn';

interface PurchaseSettingsSlideProps {
  settings: PurchaseSettings;
  onChange: (patch: Partial<PurchaseSettings>) => void;
}

/**
 * components/adena/PurchaseSettingsSlide.tsx
 * "오늘 현황"(환율/카카오ID/현재매입/목표아데나)을 접었다 펼 수 있는 슬라이드 패널로 감싼다.
 * 접은 상태에서도 sticky 요약바가 화면 상단에 계속 붙어있어서, 아래 매입 목록을 보면서도
 * 오늘 환율·현재·남은 수량을 바로 확인할 수 있다.
 */
export function PurchaseSettingsSlide({ settings, onChange }: PurchaseSettingsSlideProps) {
  const [expanded, setExpanded] = useState(true);

  const rateNum = Number(settings.rate) || 0;
  const targetNum = Number(settings.targetAmount) || 0;
  const currentNum = Number(settings.currentAmount) || 0;
  const remainingNum = Math.max(0, targetNum - currentNum);
  const liveTotal = rateNum * currentNum;

  return (
    <div className="sticky top-0 z-10 mb-6 min-[900px]:top-0">
      {!expanded && (
        <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-card/95 px-5 py-3.5 shadow-soft backdrop-blur-glass">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
            <span className="text-text-sub">
              환율 <strong className="font-display text-text">{rateNum.toLocaleString('ko-KR')}</strong>
            </span>
            <span className="text-text-sub">
              목표 <strong className="font-display text-text">{targetNum.toLocaleString('ko-KR')}만</strong>
            </span>
            <span className="text-text-sub">
              현재 <strong className="font-display text-text">{currentNum.toLocaleString('ko-KR')}만</strong>
            </span>
            <span className="text-text-sub">
              남은 <strong className="font-display text-primary">{remainingNum.toLocaleString('ko-KR')}만</strong>
            </span>
            <span className="text-text-sub">
              실시간 총 매입금액 <strong className="font-display text-success">{liveTotal.toLocaleString('ko-KR')}원</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-semibold text-text-sub transition-colors hover:bg-white/[0.1] hover:text-text'
            )}
          >
            <ChevronDown size={16} />
            펼치기
          </button>
        </div>
      )}

      {expanded && (
        <div>
          <div className="mb-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              <ChevronUp size={16} />
              접기 (목록 보면서 확인하기)
            </Button>
          </div>
          <PurchaseHeroCards settings={settings} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, Check, Settings as SettingsIcon } from 'lucide-react';
import type { PurchaseSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { PurchaseSettingsDialog } from '@/components/adena/PurchaseSettingsDialog';
import { formatAdenaAmount } from '@/utils/format';
import { cn } from '@/utils/cn';

interface PurchaseSummaryBarProps {
  settings: PurchaseSettings;
  onChange: (patch: Partial<PurchaseSettings>) => void;
}

/**
 * components/adena/PurchaseSummaryBar.tsx
 * 아데나 매입 화면 상단에 항상 보이는 요약 카드. 환율/카카오톡ID/총매입목표량/현재매입량/진행률
 * 다섯 가지를 읽기 전용으로 보여주고, 값 수정은 오른쪽 "설정" 버튼의 모달에서만 한다
 * (환율/목표매입량/카카오톡ID 세 가지만 관리 — 현재매입량은 매입 등록/수정/삭제 시 기존 로직이
 * 그대로 자동 계산한다. 계산/저장 방식은 전혀 바뀌지 않는다).
 * 수량 표시는 저장값(만 단위)에 "만 아데나"만 붙이는 형식으로 통일했다(formatAdenaAmount).
 */
export function PurchaseSummaryBar({ settings, onChange }: PurchaseSummaryBarProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rate = Number(settings.rate) || 0;
  const target = Number(settings.targetAmount) || 0;
  const current = Number(settings.currentAmount) || 0;
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const handleCopy = async () => {
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
    <div className="mb-6 rounded-2xl border border-[#1D2530] bg-[#0B1016] p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[#9AA1AC]">오늘 현황</div>
        <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon size={16} />
          설정
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 min-[720px]:grid-cols-5">
        <SummaryItem label="환율 (1만 아데나당)">
          <div className="font-display text-2xl font-bold text-white sm:text-[28px]">
            {rate.toLocaleString('ko-KR')}
            <span className="ml-1 text-sm font-semibold text-[#9AA1AC]">원</span>
          </div>
        </SummaryItem>

        <SummaryItem label="카카오톡 ID">
          <div className="flex items-center gap-2">
            <div className="truncate font-display text-lg font-bold text-white sm:text-xl">{settings.kakaoId || '-'}</div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="카카오톡 ID 복사"
              className={cn(
                'flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12px] font-semibold transition-colors',
                copied ? 'bg-success/15 text-success' : 'bg-white/[0.06] text-[#9AA1AC] hover:text-white'
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '완료' : '복사'}
            </button>
          </div>
        </SummaryItem>

        <SummaryItem label="총 매입 목표량">
          <div className="font-display text-2xl font-bold text-white sm:text-[28px]">{formatAdenaAmount(target)}</div>
        </SummaryItem>

        <SummaryItem label="현재 매입량">
          <div className="font-display text-2xl font-bold text-primary sm:text-[28px]">{formatAdenaAmount(current)}</div>
        </SummaryItem>

        <SummaryItem label="진행률">
          <div className="font-display text-2xl font-bold text-gold sm:text-[28px]">{progress}%</div>
          <div className="mt-2 h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </SummaryItem>
      </div>

      <PurchaseSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onChange={onChange} />
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium text-[#9AA1AC]">{label}</div>
      {children}
    </div>
  );
}

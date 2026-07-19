import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { ADMIN_PIN } from '@/yaki/yakiConfig';

const SESSION_KEY = 'thek-yaki-unlocked';

/**
 * yaki/PinGate.tsx
 * 관리자 페이지 진입 PIN 화면. 맞으면 이후 편집 화면이 열리고,
 * 틀리면 계속 이 화면에 머문다(수정 기능 접근 불가). sessionStorage에 "이 탭에서
 * 이미 인증됨"만 기록해, 새로고침해도 다시 PIN을 묻지 않지만 탭을 닫으면 초기화된다.
 */
export function PinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06080B] px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-[360px] rounded-2xl border border-[#1D2530] bg-[#0B1016] p-8 shadow-[0_4px_14px_rgba(0,0,0,0.4)]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-dim text-gold">
            <Lock size={26} />
          </span>
          <div>
            <div className="text-[18px] font-bold text-white">THE K 관리자</div>
            <div className="mt-1 text-[13px] text-text-sub">PIN 번호를 입력해주세요</div>
          </div>
        </div>

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(false);
          }}
          placeholder="PIN 6자리"
          className="mb-3 h-14 w-full rounded-2xl border border-border/[0.12] bg-white/[0.04] px-5 text-center text-[22px] font-bold tracking-[0.3em] text-text outline-none focus:border-gold"
        />

        {error && <div className="mb-3 text-center text-[13px] font-semibold text-danger">PIN이 올바르지 않습니다. 다시 입력해주세요.</div>}

        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold text-[16px] font-bold text-[#1A1408] shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
          <ShieldCheck size={20} />
          확인
        </button>
      </form>
    </div>
  );
}

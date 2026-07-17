import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * components/ui/drawer.tsx
 * 우측에서 슬라이드로 열리는 설정 패널. Desktop에서는 폭 620~700px 고정 패널,
 * 375px 등 좁은 화면에서는 화면 하단에서 올라오는 BottomSheet(전체 폭)로 자동 전환된다.
 */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[900]">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute bottom-0 right-0 top-0 flex w-full max-w-[680px] flex-col border-l border-[#1D2530] bg-[#0B1016] shadow-[0_0_40px_rgba(0,0,0,0.5)]',
          'animate-slide-in',
          'max-[720px]:inset-x-0 max-[720px]:bottom-0 max-[720px]:top-auto max-[720px]:max-h-[88vh] max-[720px]:max-w-none max-[720px]:rounded-t-[20px] max-[720px]:border-l-0 max-[720px]:border-t'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#1D2530] p-6">
          <div className="text-[17px] font-bold text-white">{title}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-[#1D2530] p-6">{footer}</div>}
      </div>
    </div>
  );
}

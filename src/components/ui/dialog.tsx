import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  narrow?: boolean;
}

/** 모달 다이얼로그. ESC와 배경 클릭으로 닫힌다 (PRD-07 스펙: width 720px, radius 24px). */
export function Dialog({ open, onClose, title, children, footer, narrow }: DialogProps) {
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
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-5">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative max-h-[84vh] w-full animate-scale-in overflow-y-auto rounded-modal border border-border/[0.14] bg-card/90 p-7',
          'shadow-soft backdrop-blur-glass',
          narrow ? 'max-w-[480px]' : 'max-w-[720px]'
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[17px] font-bold">{title}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </Button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmContextValue {
  confirm: (message: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setMessage(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={message !== null} onClose={() => close(false)} title="확인" narrow>
        <p className="text-sm text-text-sub">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={() => close(true)}>
            확인
          </Button>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/** 삭제/초기화/가져오기 전 확인창을 띄우는 훅. `if (await confirm('...')) { ... }` 형태로 사용한다. */
export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm은 ConfirmProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}

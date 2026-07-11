import { createContext, useContext, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

interface PendingEditContextValue {
  takePendingEditId: () => string | null;
  setPendingEditId: (id: string) => void;
}

const PendingEditContext = createContext<PendingEditContextValue | null>(null);

/**
 * 분석 페이지의 TOP10/최근기록 카드를 클릭하면 경험치 기록 페이지로 이동하면서
 * 해당 기록을 바로 수정 폼에 띄워야 한다. 라우트 전환은 비동기(hashchange)로 일어나므로
 * "다음에 experience 페이지가 마운트되면 이 id를 수정 모드로 열어라"를 전달하는 용도의 Context.
 */
export function PendingEditProvider({ children }: { children: ReactNode }) {
  const ref = useRef<string | null>(null);

  const value = useMemo<PendingEditContextValue>(
    () => ({
      takePendingEditId: () => {
        const id = ref.current;
        ref.current = null;
        return id;
      },
      setPendingEditId: (id: string) => {
        ref.current = id;
      },
    }),
    []
  );

  return <PendingEditContext.Provider value={value}>{children}</PendingEditContext.Provider>;
}

export function usePendingEdit(): PendingEditContextValue {
  const ctx = useContext(PendingEditContext);
  if (!ctx) throw new Error('usePendingEdit은 PendingEditProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}

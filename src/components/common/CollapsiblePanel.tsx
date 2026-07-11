import { useState } from 'react';
import type { ReactNode } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * components/common/CollapsiblePanel.tsx
 * 기본적으로 접혀 있는 패널. "⚙ 설정 보기" 버튼을 누르면 펼쳐지고, 다시 누르면 접힌다.
 * 기능은 그대로 두고 화면을 덜 차지하게 하기 위한 순수 UI 래퍼.
 */
export function CollapsiblePanel({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-10">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        <Settings size={16} />
        {open ? `${label} 닫기` : `⚙ ${label} 보기`}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>
      {open && <div className="mt-4 flex flex-col gap-8">{children}</div>}
    </div>
  );
}

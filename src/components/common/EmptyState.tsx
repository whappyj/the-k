import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
}

/** PRD-07 Empty State 규정: 아이콘 + "데이터가 없습니다" 톤의 안내 문구. */
export function EmptyState({ icon: Icon = Inbox, title = '데이터가 없습니다.', description }: EmptyStateProps) {
  return (
    <div className="py-14 text-center text-text-faint">
      <Icon className="mx-auto mb-3.5 h-8 w-8 text-text-faint" />
      <div className="mb-1 text-sm font-semibold text-text-sub">{title}</div>
      <div className="text-[13px] text-text-faint">{description}</div>
    </div>
  );
}

/** 표/리스트 안에서 쓰는 한 줄짜리 빈 상태 (아이콘 없이 간결하게). */
export function EmptyCell({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-[13px] text-text-faint">{children}</div>;
}

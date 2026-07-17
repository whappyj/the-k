import type { HTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * components/ui/card.tsx
 * THE K 공통 Card. Black + Gold, Modern Professional Launcher 톤.
 * 모든 화면(기록하기/기록목록/비교/통계/제작견적/계산기/설정)이 동일한 Radius/Border/Padding/
 * Hover/Active를 쓰도록 여기 한 곳에서만 정의한다.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-[#1D2530] bg-[#0B1016] p-6 shadow-[0_4px_14px_rgba(0,0,0,0.28)]',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  );
}

/** 클릭 가능한 타일형 카드. Hover 시 위로 2px 뜨고 테두리가 골드로, 그림자가 은은하게 짙어진다. */
export function InteractiveCard({ className, onClick, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e as unknown as ReactMouseEvent<HTMLDivElement>);
        }
        onKeyDown?.(e);
      }}
      className={cn(
        'cursor-pointer hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_6px_18px_rgba(0,0,0,0.32)] active:translate-y-0',
        className
      )}
      {...props}
    />
  );
}

/** "사냥 설정 / 시작 / 종료 / 결과"처럼 화면을 4개 영역으로 나눌 때 쓰는 큰 구획 패널. Card와 동일한 톤이되
 *  섹션 타이틀 자리(숫자 배지 + 제목)가 이미 갖춰져 있다. */
export function Panel({
  step,
  title,
  action,
  accent = 'gold',
  className,
  children,
}: {
  step?: number;
  title: string;
  action?: ReactNode;
  accent?: 'gold' | 'green' | 'red' | 'blue';
  className?: string;
  children: ReactNode;
}) {
  const accentClass = {
    gold: 'bg-gold-dim text-gold',
    green: 'bg-success-dim text-success',
    red: 'bg-danger-dim text-danger',
    blue: 'bg-primary-dim text-primary',
  }[accent];

  return (
    <Card className={className}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {step != null && (
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg font-display text-[12px] font-bold', accentClass)}>{step}</span>
          )}
          <span className="text-[15px] font-bold text-white">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-1 text-[15px] font-semibold text-text', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 text-[13px] text-text-sub', className)} {...props} />;
}

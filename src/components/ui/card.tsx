import type { HTMLAttributes, MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '@/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-border/[0.08] bg-card/85 p-6 shadow-soft backdrop-blur-glass',
        'transition-[border-color,box-shadow,transform] duration-200 hover:border-border/[0.14]',
        className
      )}
      {...props}
    />
  );
}

/** 클릭 가능한 타일형 카드 (hover scale 1.02 + 강한 그림자). 키보드(TAB/ENTER)로도 실행 가능하다. */
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
      className={cn('cursor-pointer hover:scale-[1.02] hover:shadow-hover', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-1 text-[15px] font-semibold text-text', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 text-[13px] text-text-sub', className)} {...props} />;
}

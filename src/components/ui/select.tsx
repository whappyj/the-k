import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * 네이티브 &lt;select&gt;를 shadcn 스타일로 감싼 프리미티브.
 * 검색 가능한 콤보박스(Combobox)는 이번 범위에서 제외했다 — 필요 시 cmdk 기반으로 확장 가능.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-input border border-border/[0.08] bg-white/[0.04] px-3 text-text outline-none',
      'transition-colors duration-200 focus:border-primary',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

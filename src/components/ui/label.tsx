import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[13px] font-medium text-text-sub', className)} {...props} />;
}

import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', {
  variants: {
    variant: {
      primary: 'bg-primary-dim text-primary',
      success: 'bg-success-dim text-success',
      warning: 'bg-warning-dim text-warning',
      danger: 'bg-danger-dim text-danger',
      muted: 'bg-white/[0.06] text-text-sub',
    },
  },
  defaultVariants: { variant: 'primary' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

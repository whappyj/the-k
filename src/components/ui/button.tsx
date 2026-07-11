import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-btn text-sm font-semibold transition-transform duration-200 ease-out hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] active:opacity-100 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white',
        secondary: 'bg-white/[0.06] text-text border border-border/[0.08] hover:bg-white/[0.10]',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        danger: 'bg-danger text-white',
        ghost: 'bg-transparent text-text-sub hover:text-text hover:bg-white/[0.05]',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3.5 text-[13px]',
        icon: 'h-9 w-9 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';

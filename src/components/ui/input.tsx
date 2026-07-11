import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full min-w-0 rounded-input border border-border/[0.08] bg-white/[0.04] px-3.5 text-text outline-none placeholder:text-text-faint',
      'transition-colors duration-200 focus:border-primary focus:bg-primary/[0.06]',
      'disabled:cursor-not-allowed disabled:opacity-40',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

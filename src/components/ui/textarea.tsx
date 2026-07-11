import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[80px] w-full resize-y rounded-input border border-border/[0.08] bg-white/[0.04] px-3.5 py-3 text-text outline-none placeholder:text-text-faint',
      'transition-colors duration-200 focus:border-primary focus:bg-primary/[0.06]',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

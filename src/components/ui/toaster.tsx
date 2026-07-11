import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

const TYPE_BORDER: Record<string, string> = {
  success: 'border-success/40',
  danger: 'border-danger/40',
  default: 'border-border/[0.14]',
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-6 top-6 z-[1000] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl border bg-card-secondary px-4 py-3 text-[13px] text-text shadow-soft',
            TYPE_BORDER[t.type] ?? TYPE_BORDER.default
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

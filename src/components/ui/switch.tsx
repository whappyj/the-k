import { cn } from '@/utils/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

/** iOS 스타일 토글 스위치. 200ms 트랜지션. */
export function Switch({ checked, onCheckedChange, disabled, ...aria }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-white/[0.12]',
        disabled && 'cursor-not-allowed opacity-40'
      )}
      {...aria}
    >
      <span
        className={cn(
          'absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white transition-transform duration-200',
          checked && 'translate-x-[18px]'
        )}
      />
    </button>
  );
}

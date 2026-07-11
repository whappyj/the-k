import { cn } from '@/utils/cn';
import { QTY_TIERS } from '@/constants';

interface QtySelectCardsProps {
  value: 1 | 3 | 5;
  onChange: (tier: 1 | 3 | 5) => void;
}

export function QtySelectCards({ value, onChange }: QtySelectCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
      {QTY_TIERS.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => onChange(tier)}
          className={cn(
            'rounded-2xl border border-[#2A2F38] bg-[#171A20] p-[22px] text-center transition-all duration-200 hover:scale-[1.02]',
            value === tier && 'border-primary bg-primary-dim'
          )}
        >
          <div className={cn('font-display text-[26px] font-bold', value === tier ? 'text-primary' : 'text-white')}>{tier}개</div>
          <div className={cn('mt-1 text-[13px]', value === tier ? 'text-primary' : 'text-[#8A93A3]')}>제작</div>
        </button>
      ))}
    </div>
  );
}

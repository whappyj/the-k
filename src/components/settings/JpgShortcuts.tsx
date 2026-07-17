import { Home, Coins, BarChart3, CalendarClock } from 'lucide-react';
import { Card, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJpgExport } from '@/hooks/useJpgExport';
import type { Route } from '@/types';

const SHORTCUTS: { route: Route; icon: typeof Home; label: string }[] = [
  { route: 'home', icon: Home, label: '현재 페이지 저장' },
  { route: 'estimate', icon: Coins, label: '제작 견적 저장' },
  { route: 'analysis', icon: BarChart3, label: '기록 목록 저장' },
  { route: 'calculator', icon: CalendarClock, label: '레벨업 시뮬레이터 저장' },
];

export function JpgShortcuts() {
  const { exportPage } = useJpgExport();

  return (
    <Card>
      <CardDescription>저장 즉시 페이지 이동 후 고화질 JPG로 다운로드됩니다.</CardDescription>
      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
        {SHORTCUTS.map(({ route, icon: Icon, label }) => (
          <Button key={route} variant="warning" onClick={() => exportPage(route)} className="h-auto min-w-0 flex-col gap-2 whitespace-normal py-[18px] text-center">
            <Icon size={20} />
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

import { Card, CardTitle, CardDescription } from '@/components/ui/card';

const PLANNED = ['새 탭 생성', '탭 이름 변경', '탭 순서 변경', '탭 삭제'];

export function FutureTabs() {
  return (
    <Card className="border-dashed bg-white/[0.03] p-8">
      <span className="mb-2.5 inline-block rounded-full bg-white/[0.05] px-2.5 py-[3px] text-[11px] font-bold text-text-faint">향후 추가 예정</span>
      <CardTitle className="mt-2">나만의 탭 만들기</CardTitle>
      <CardDescription>
        기본 탭(홈 · 제작 비교 견적 · 경험치 기록 · 경험치 분석 · 24시간 계산기)은 삭제할 수 없으며, 아래 기능은 다음 업데이트에서 제공될 예정입니다.
      </CardDescription>
      <div className="mt-1 flex flex-wrap gap-4">
        {PLANNED.map((p) => (
          <span key={p} className="rounded-full border border-border/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] text-text-sub">
            {p}
          </span>
        ))}
      </div>
    </Card>
  );
}

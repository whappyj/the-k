import { useState } from 'react';
import { BookOpen, Calculator, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

export interface HelpContent {
  usage: string[];
  calculation: string[];
  caution: string[];
}

/**
 * components/common/HelpButton.tsx
 * 모든 페이지 제목 옆(모바일에서는 자동 줄바꿈)에 붙는 공통 "📖 사용설명서" 버튼.
 * 페이지 진입 시 가장 먼저 눈에 띄는 보조 액션 버튼 수준으로 존재감을 키웠다
 * (48px 높이, 16px Bold, shadow-md 기본 + hover 시 shadow-xl·scale 1.03).
 * 클릭하면 Modal로 사용법 / 계산 방식 / 주의사항 3개 섹션을 보여준다 — Dialog와
 * HelpSection 내용/동작은 그대로이며, 트리거 버튼의 디자인만 바꿨다.
 * 페이지별로 다른 content만 넘기면 된다.
 */
export function HelpButton({ content }: { content: HelpContent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="사용설명서"
        className="inline-flex h-12 w-auto shrink-0 items-center gap-2.5 rounded-[12px] bg-primary px-6 text-base font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
      >
        <BookOpen size={20} />
        📖 사용설명서
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="❓ 도움말">
        <div className="flex flex-col gap-6">
          <HelpSection icon={BookOpen} tone="blue" title="사용법" items={content.usage} />
          <HelpSection icon={Calculator} tone="primary" title="계산 방식" items={content.calculation} />
          <HelpSection icon={AlertTriangle} tone="red" title="주의사항" items={content.caution} />
        </div>
      </Dialog>
    </>
  );
}

const TONE_CLASS = {
  blue: 'bg-primary-dim text-primary',
  primary: 'bg-primary-dim text-primary',
  red: 'bg-danger-dim text-danger',
} as const;

function HelpSection({ icon: Icon, tone, title, items }: { icon: typeof BookOpen; tone: keyof typeof TONE_CLASS; title: string; items: string[] }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
          <Icon size={16} />
        </span>
        <span className="text-[14px] font-bold text-white">{title}</span>
      </div>
      <ul className="flex flex-col gap-1.5 pl-1">
        {items.map((item, i) => (
          <li key={i} className="text-[13px] leading-relaxed text-text-sub">
            • {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

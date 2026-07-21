import { Dialog } from '@/components/ui/dialog';
import { FEATURE_GUIDE, EXPORT_FORMAT_GUIDE } from '@/lib/adenaGuideContent';

/**
 * components/adena/FeatureGuideDialog.tsx ("기능 도움말")
 * 앱 전체 기능(홈~FAQ)과 내보내기 포맷별 용도를 한 곳에서 설명한다.
 * 관리자(yaki)/OCR 전용 도움말은 포함하지 않는다(요청에 따라 별도로 만들지 않음).
 */
export function FeatureGuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="📖 기능 도움말">
      <div className="flex flex-col gap-6">
        {FEATURE_GUIDE.map((item) => (
          <section key={item.title} className="rounded-2xl border border-[#1D2530] bg-white/[0.02] p-6">
            <div className="mb-4 text-[15px] font-bold text-primary">{item.title}</div>
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <Row label="무엇을 하나요" value={item.what} />
              <Row label="언제 쓰나요" value={item.when} />
              <Row label="입력 방법" value={item.howToInput} />
              <div>
                <dt className="mb-1 font-semibold text-text-sub">사용 순서</dt>
                <dd>
                  <ol className="flex flex-col gap-1 pl-4 text-text">
                    {item.steps.map((s, i) => (
                      <li key={i} className="list-decimal">
                        {s}
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
              <Row label="팁" value={item.tip} highlight />
            </dl>
          </section>
        ))}

        <section className="rounded-2xl border border-[#1D2530] bg-white/[0.02] p-6">
          <div className="mb-4 text-[15px] font-bold text-primary">내보내기 포맷별 용도</div>
          <div className="flex flex-col gap-2">
            {EXPORT_FORMAT_GUIDE.map((f) => (
              <div key={f.format} className="flex flex-col gap-0.5 border-b border-[#1D2530] pb-2 text-[13px] last:border-none last:pb-0">
                <span className="font-bold text-white">{f.format}</span>
                <span className="text-text-sub">{f.usage}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Dialog>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="mb-1 font-semibold text-text-sub">{label}</dt>
      <dd className={highlight ? 'text-primary' : 'text-text'}>{value}</dd>
    </div>
  );
}

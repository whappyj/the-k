import { Dialog } from '@/components/ui/dialog';
import { BROADCAST_GUIDE } from '@/lib/adenaGuideContent';

/**
 * components/adena/BroadcastGuideDialog.tsx ("방송 도움말")
 * OBS Studio/SOOP 프릭샷/Streamlabs Desktop/XSplit/vMix 각각의 브라우저 소스 추가 방법,
 * 윈도우 캡처 방법, 권장 해상도, OBS 레이아웃 사용법, 실시간 매입 등록, 시청자 확인 방법,
 * 오버레이 활용법을 설명한다. 브라우저 소스 방식을 가장 추천한다고 안내한다.
 */
export function BroadcastGuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="📺 방송 도움말">
      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary-dim p-4 text-[13px] font-semibold text-primary">
        💡 어떤 프로그램을 쓰든 "브라우저 소스" 방식을 가장 추천합니다 — 창 캡처보다 화질이 선명하고 컴퓨터 자원도 적게 씁니다.
      </div>
      <div className="flex flex-col gap-6">
        {BROADCAST_GUIDE.map((g) => (
          <section key={g.name} className="rounded-2xl border border-[#1D2530] bg-white/[0.02] p-6">
            <div className="mb-4 text-[15px] font-bold text-primary">{g.name}</div>
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <Row label="브라우저 소스 추가 방법" value={g.browserSource} />
              <Row label="윈도우 캡처 방법" value={g.windowCapture} />
              <Row label="권장 해상도" value={g.resolution} />
              <Row label="OBS 레이아웃 사용법" value={g.obsLayoutUsage} />
              <Row label="방송 중 매입 등록" value={g.liveRegistration} />
              <Row label="시청자가 매입 내역 확인하는 방법" value={g.viewerCheck} />
              <Row label="오버레이 활용법" value={g.overlayTip} highlight />
            </dl>
          </section>
        ))}
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

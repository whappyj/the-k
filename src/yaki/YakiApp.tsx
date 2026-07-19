import { PinGate } from '@/yaki/PinGate';
import { EstimateDataEditor } from '@/yaki/EstimateDataEditor';

/**
 * yaki/YakiApp.tsx
 * yaki.html의 최상위 컴포넌트. 메인 앱(App.tsx)과 완전히 독립된 별도 진입점이며,
 * calculations.ts/appDataReducer.ts/useAppData.tsx 등 메인 앱의 상태·리듀서와는
 * 전혀 연결되지 않는다 — estimate-data.json 파일만 읽고 쓸 뿐이다.
 */
export function YakiApp() {
  return (
    <div className="min-h-screen bg-[#06080B] text-text">
      <PinGate>
        <EstimateDataEditor />
      </PinGate>
    </div>
  );
}

import type { PurchaseSettings } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PurchaseSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: PurchaseSettings;
  onChange: (patch: Partial<PurchaseSettings>) => void;
}

/**
 * components/adena/PurchaseSettingsDialog.tsx
 * 아데나 매입 "설정" 모달. 환율(1만 아데나당) / 총 매입 목표량 / 카카오톡 ID, 이 세 가지만 관리한다.
 * 현재 매입량은 매입 등록/수정/삭제 시 기존 로직이 자동으로 계산하므로 여기서는 다루지 않는다.
 * patchPurchaseSettings 하나만 그대로 재사용하며 계산식/저장 방식은 전혀 바뀌지 않는다.
 */
export function PurchaseSettingsDialog({ open, onClose, settings, onChange }: PurchaseSettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="아데나 매입 설정" narrow>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label>환율 (1만 아데나당)</Label>
          <Input type="number" min={0} value={settings.rate || ''} placeholder="예: 900" onChange={(e) => onChange({ rate: Number(e.target.value) || 0 })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>총 매입 목표량 (만)</Label>
          <Input type="number" min={0} value={settings.targetAmount || ''} placeholder="0" onChange={(e) => onChange({ targetAmount: Number(e.target.value) || 0 })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>카카오톡 ID</Label>
          <Input value={settings.kakaoId} placeholder="예: theK_kakao" onChange={(e) => onChange({ kakaoId: e.target.value })} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          완료
        </Button>
      </div>
    </Dialog>
  );
}

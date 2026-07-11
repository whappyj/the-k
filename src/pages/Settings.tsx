import { PageHeader } from '@/components/layout/PageHeader';
import { DataManagement } from '@/components/settings/DataManagement';
import { JpgShortcuts } from '@/components/settings/JpgShortcuts';
import { FutureTabs } from '@/components/settings/FutureTabs';
import { PreferencesForm } from '@/components/settings/PreferencesForm';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { EstimateConditionSettings } from '@/components/settings/EstimateConditionSettings';
import { MaterialEditor } from '@/components/estimate/MaterialEditor';
import { QtySelectCards } from '@/components/estimate/QtySelectCards';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { APP_VERSION } from '@/constants';
import type { EstimateMaterial } from '@/types';

/**
 * pages/Settings.tsx
 * 설정 화면. 기본설정 / 비교조건 / 재료목록 / 제작수량 / 표시설정 / 데이터관리 6개 탭으로 구성된다.
 * "비교조건/재료목록/제작수량" 탭은 제작 비교 견적 화면과 완전히 같은 estimate 데이터를
 * patchEstimate 하나로 공유하므로, 여기서 바꾸면 제작 비교 견적 화면에도 즉시 반영된다.
 * 재료는 자유롭게 추가/삭제/수정할 수 있어 새 제작 아이템이 늘어나도 코드 수정이 필요 없다.
 */
export function SettingsPage() {
  const { data } = useAppData();
  const { patchEstimate, resetEstimateToBase } = useAppDataActions();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const estimate = data.estimate;

  const handleMaterialsChange = (materials: EstimateMaterial[]) => patchEstimate({ materials });
  const handleResetMaterials = async () => {
    if (await confirm('현재 재료 구성을 기본 프리셋("달의 장궁")으로 초기화합니다.')) {
      resetEstimateToBase();
      showToast('기본 구성으로 초기화했습니다.', 'success');
    }
  };
  const handleRateChange = (group: 'A' | 'B', value: number) => patchEstimate(group === 'A' ? { rateA: value } : { rateB: value });
  const handleKeyPriceChange = (group: 'A' | 'B', value: number) => {
    const keyMaterial = estimate.materials[0];
    if (!keyMaterial) return;
    const key = group === 'A' ? 'priceA' : 'priceB';
    patchEstimate({ materials: estimate.materials.map((m) => (m.id === keyMaterial.id ? { ...m, [key]: value } : m)) });
  };

  return (
    <div id="page-settings">
      <PageHeader title="설정" subtitle="비교 조건, 재료, 표시 방식, 데이터를 한 곳에서 관리합니다." />

      <SettingsTabs
        tabs={[
          {
            id: 'basic',
            label: '기본 설정',
            content: (
              <div className="flex flex-col gap-5">
                <JpgShortcuts />
                <FutureTabs />
              </div>
            ),
          },
          {
            id: 'condition',
            label: '비교 조건',
            content: (
              <EstimateConditionSettings
                materials={estimate.materials}
                rateA={estimate.rateA}
                rateB={estimate.rateB}
                onRateChange={handleRateChange}
                onKeyPriceChange={handleKeyPriceChange}
              />
            ),
          },
          {
            id: 'materials',
            label: '재료 목록',
            content: (
              <MaterialEditor materials={estimate.materials} onChange={handleMaterialsChange} onReset={handleResetMaterials} onApplyToast={() => showToast('재료 구성을 적용했습니다.', 'success')} />
            ),
          },
          {
            id: 'qty',
            label: '제작 수량',
            content: <QtySelectCards value={estimate.qtyTier} onChange={(tier) => patchEstimate({ qtyTier: tier })} />,
          },
          {
            id: 'display',
            label: '표시 설정',
            content: <PreferencesForm />,
          },
          {
            id: 'data',
            label: '데이터 관리',
            content: <DataManagement />,
          },
        ]}
      />

      <div className="mt-8 text-center text-[11px] text-text-faint">THE K v{APP_VERSION}</div>
    </div>
  );
}

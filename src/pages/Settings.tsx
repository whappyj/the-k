import { PageHeader } from '@/components/layout/PageHeader';
import { HelpButton } from '@/components/common/HelpButton';
import { HELP_SETTINGS } from '@/lib/helpContent';
import { DataManagement } from '@/components/settings/DataManagement';
import { JpgShortcuts } from '@/components/settings/JpgShortcuts';
import { FutureTabs } from '@/components/settings/FutureTabs';
import { PreferencesForm } from '@/components/settings/PreferencesForm';
import { SettingsTabs, SettingsTabIcons } from '@/components/settings/SettingsTabs';
import { APP_VERSION } from '@/constants';

const { SettingsIcon, Database } = SettingsTabIcons;

/**
 * pages/Settings.tsx
 * 설정 화면 — 백업/복원/초기화/버전정보 중심으로 간소화했다.
 * 환율·시세·재료·수량·프리셋 설정은 "제작 비교 견적" 화면의 "⚙ 비교 설정" Drawer로
 * 이동했다(같은 estimate 데이터를 그대로 patchEstimate로 공유하므로 계산/저장 로직은 무변경).
 */
export function SettingsPage() {
  return (
    <div id="page-settings">
      <PageHeader title="설정" subtitle="일반 환경설정과 데이터 백업·복원을 관리합니다." actions={<HelpButton content={HELP_SETTINGS} />} />

      <SettingsTabs
        tabs={[
          {
            id: 'basic',
            label: '일반',
            icon: SettingsIcon,
            content: (
              <div className="flex flex-col gap-5">
                <JpgShortcuts />
                <PreferencesForm />
                <FutureTabs />
              </div>
            ),
          },
          {
            id: 'data',
            label: '데이터 관리',
            icon: Database,
            content: <DataManagement />,
          },
        ]}
      />

      <div className="mt-8 text-center text-[11px] text-text-faint">THE K v{APP_VERSION}</div>
    </div>
  );
}

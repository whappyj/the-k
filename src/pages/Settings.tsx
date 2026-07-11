import { PageHeader, Section } from '@/components/layout/PageHeader';
import { DataManagement } from '@/components/settings/DataManagement';
import { JpgShortcuts } from '@/components/settings/JpgShortcuts';
import { FutureTabs } from '@/components/settings/FutureTabs';
import { PreferencesForm } from '@/components/settings/PreferencesForm';
import { APP_VERSION } from '@/constants';

export function SettingsPage() {
  return (
    <div id="page-settings">
      <PageHeader title="⚙ 데이터 관리 및 설정" subtitle="THE K의 모든 데이터를 백업, 복원, 관리합니다. 게임 정보는 저장하지 않습니다." />

      <Section title="데이터 관리">
        <DataManagement />
      </Section>

      <Section title="JPG 저장">
        <JpgShortcuts />
      </Section>

      <Section title="사용자 정의">
        <FutureTabs />
      </Section>

      <Section title="설정">
        <PreferencesForm />
      </Section>

      <div className="text-center text-[11px] text-text-faint">THE K v{APP_VERSION}</div>
    </div>
  );
}

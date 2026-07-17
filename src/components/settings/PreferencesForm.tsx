import type { ReactNode } from 'react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { ImportExportButtons } from '@/components/common/ImportExportButtons';
import { exportSection, readThekFile, parseSectionFile } from '@/lib/importExportService';
import type { AppSettings } from '@/types';

export function PreferencesForm() {
  const { data } = useAppData();
  const { patchSettings, importMerge } = useAppDataActions();
  const { showToast } = useToast();
  const s = data.settings;

  const handleExportSection = () => {
    exportSection('settings', { settings: data.settings }, '설정');
    showToast('설정을 내보냈습니다.', 'success');
  };

  const handleImportSection = async (file: File) => {
    try {
      const json = await readThekFile(file);
      const result = parseSectionFile<{ settings?: AppSettings }>(json, 'settings');
      if (!result.ok) return showToast(result.error, 'danger');
      importMerge({ settings: result.data.settings });
      showToast('설정을 불러와 적용했습니다. (다른 화면 데이터는 그대로입니다)', 'success', 2500);
    } catch {
      showToast('.thek 파일 형식이 올바르지 않습니다.', 'danger');
    }
  };

  return (
    <Card>
      <Row label="다크모드" desc="기본 ON. 끄면 라이트 테마로 전환됩니다.">
        <Switch
          checked={s.theme === 'dark'}
          onCheckedChange={(checked) => {
            const theme = checked ? 'dark' : 'light';
            patchSettings({ theme });
            showToast(theme === 'dark' ? '다크모드로 전환했습니다.' : '라이트모드로 전환했습니다.', 'success');
          }}
          aria-label="다크모드"
        />
      </Row>

      <Row label="애니메이션" desc="화면 전환, 호버 등의 애니메이션 효과">
        <Switch checked={s.animation} onCheckedChange={(v) => patchSettings({ animation: v })} aria-label="애니메이션" />
      </Row>

      <Row label="숫자 표시" desc="큰 숫자에 천 단위 구분 콤마 표시 여부">
        <Select className="max-w-[180px]" value={s.numberFormat} onChange={(e) => patchSettings({ numberFormat: e.target.value as 'comma' | 'plain' })}>
          <option value="comma">1,000</option>
          <option value="plain">1000</option>
        </Select>
      </Row>

      <Row label="소수점 표시" desc="경험치(%) 값의 소수점 자리수 (기본 4자리)">
        <Select className="max-w-[180px]" value={String(s.decimalPlaces)} onChange={(e) => patchSettings({ decimalPlaces: Number(e.target.value) as 2 | 3 | 4 })}>
          <option value="2">2자리</option>
          <option value="3">3자리</option>
          <option value="4">4자리</option>
        </Select>
      </Row>

      <Row label="자동 저장" desc="입력 중인 내용을 실시간으로 임시 저장 (기본 ON)">
        <Switch checked={s.autoSave} onCheckedChange={(v) => patchSettings({ autoSave: v })} aria-label="자동 저장" />
      </Row>

      <Row label="JPG 저장 품질" desc="고화질일수록 파일 용량이 커집니다." last>
        <Select className="max-w-[180px]" value={s.jpgQuality} onChange={(e) => patchSettings({ jpgQuality: e.target.value as 'high' | 'veryHigh' | 'lossless' })}>
          <option value="high">High</option>
          <option value="veryHigh">Very High</option>
          <option value="lossless">Lossless</option>
        </Select>
      </Row>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/[0.08] pt-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">설정 내보내기 / 불러오기</div>
          <div className="mt-0.5 text-xs text-text-sub">위 환경설정 값만 담습니다 (다른 화면 데이터는 포함되지 않습니다).</div>
        </div>
        <ImportExportButtons label="설정" onExport={handleExportSection} onImportFile={handleImportSection} />
      </div>
    </Card>
  );
}

function Row({ label, desc, children, last }: { label: string; desc: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${last ? '' : 'border-b border-border/[0.08]'}`}>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-0.5 text-xs text-text-sub">{desc}</div>
      </div>
      {children}
    </div>
  );
}

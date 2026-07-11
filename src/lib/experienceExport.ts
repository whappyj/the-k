import type { ExperienceRecord } from '@/types';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** 경험치 기록 목록을 CSV로 내보낸다 (엑셀에서도 그대로 열림). */
export function exportExperienceRecordsCsv(records: ExperienceRecord[]): void {
  const header = [
    '등록시간', '사냥터', '시작레벨', '종료레벨', '시작일', '시작시간', '종료일', '종료시간', '마을체류(분)',
    '시작경험치(%)', '종료경험치(%)', '획득경험치(%)', '시간당경험치(%)',
    '기사', '요정', '법사', '비비기', '비비기인원', '몰이', '메모',
  ];
  const rows = records.map((r) =>
    [
      new Date(r.createdAt).toLocaleString('ko-KR'), r.huntArea, String(r.startLevel), String(r.endLevel), r.startDate, r.startTime, r.endDate, r.endTime, String(r.townMinutes),
      r.startExp.toFixed(4), r.endExp.toFixed(4), r.gainExp.toFixed(4), r.expPerHour.toFixed(2),
      String(r.party.knight), String(r.party.elf), String(r.party.wizard),
      r.bibigi.enabled ? 'ON' : 'OFF', String(r.bibigi.count), r.molly ? 'ON' : 'OFF', r.memo,
    ]
      .map(csvEscape)
      .join(',')
  );
  const csv = ['\uFEFF' + header.join(','), ...rows].join('\n'); // BOM 포함 - 엑셀에서 한글이 안 깨지게

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `경험치기록-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

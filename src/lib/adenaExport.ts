import * as XLSX from 'xlsx';
import type { PurchaseRecord, PurchaseSettings } from '@/types';
import { formatAdenaAmount } from '@/utils/format';

/**
 * lib/adenaExport.ts
 * 아데나 매입 리스트를 Excel(.xlsx)/CSV(.csv)/TXT(.txt)/JSON(.json)으로 내보낸다.
 * 전부 이미 저장된 purchaseRecords/purchaseSettings를 그대로 옮겨 적을 뿐, 새 계산식은 없다.
 * calculations.ts/appDataReducer.ts는 전혀 사용하지 않는다(순수 표시·내보내기 전용 유틸).
 */

export interface ExportRow {
  no: number;
  accountId: string;
  amountLabel: string;
  cashAmountLabel: string;
  timeLabel: string;
  statusLabel: string;
  memo: string;
}

export interface ExportSummary {
  totalCount: number;
  totalAmountLabel: string;
  totalCashLabel: string;
  rateLabel: string;
  targetLabel: string;
  currentLabel: string;
  progressLabel: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

export function buildExportRows(records: PurchaseRecord[]): ExportRow[] {
  return records.map((r, i) => ({
    no: i + 1,
    accountId: r.accountId,
    amountLabel: formatAdenaAmount(r.amount),
    cashAmountLabel: `${r.cashAmount.toLocaleString('ko-KR')}원`,
    timeLabel: formatTime(r.createdAt),
    statusLabel: r.depositCompleted ? '입금완료' : '-',
    memo: r.memo || '-',
  }));
}

export function buildExportSummary(records: PurchaseRecord[], settings: PurchaseSettings): ExportSummary {
  const totalAmount = records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalCash = records.reduce((s, r) => s + (Number(r.cashAmount) || 0), 0);
  const target = Number(settings.targetAmount) || 0;
  const current = Number(settings.currentAmount) || 0;
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return {
    totalCount: records.length,
    totalAmountLabel: formatAdenaAmount(totalAmount),
    totalCashLabel: `${totalCash.toLocaleString('ko-KR')}원`,
    rateLabel: `${(Number(settings.rate) || 0).toLocaleString('ko-KR')}원`,
    targetLabel: formatAdenaAmount(target),
    currentLabel: formatAdenaAmount(current),
    progressLabel: `${progress}%`,
  };
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const HEADER = ['번호', '닉네임', '수량(만 아데나)', '금액', '시간', '상태', '비고'];

function toAoA(rows: ExportRow[]): (string | number)[][] {
  return [HEADER, ...rows.map((r) => [r.no, r.accountId, r.amountLabel, r.cashAmountLabel, r.timeLabel, r.statusLabel, r.memo])];
}

/** TXT(메모장) 미리보기/다운로드용 텍스트를 만든다. 레코드마다 닉네임/수량/금액/상태를
 *  줄바꿈으로 쌓고 구분선으로 나누는 형식 — 좁은 텍스트창(방송 채팅창 등)에 붙여넣어도
 *  표(테이블) 형식보다 줄이 깨지지 않고 읽기 쉽다. */
export function buildTxtContent(records: PurchaseRecord[], settings: PurchaseSettings): string {
  const rows = buildExportRows(records);
  const summary = buildExportSummary(records, settings);
  const line = '='.repeat(30);
  const divider = '-'.repeat(16);
  const out: string[] = [];
  out.push('THE K 아데나 매입 현황');
  out.push(`환율 : ${summary.rateLabel} (1만 아데나당)`);
  out.push(`카카오톡 ID : ${settings.kakaoId || '-'}`);
  out.push(line);
  for (const r of rows) {
    out.push(r.accountId);
    out.push(r.amountLabel);
    out.push(r.cashAmountLabel);
    out.push(r.statusLabel === '입금완료' ? '입금완료' : '미입금');
    if (r.memo !== '-') out.push(`(${r.memo})`);
    out.push(divider);
  }
  out.push(`총 매입 건수 : ${summary.totalCount}건`);
  out.push(`총 매입량    : ${summary.totalAmountLabel}`);
  out.push(`총 매입금액  : ${summary.totalCashLabel}`);
  out.push(`환율         : ${summary.rateLabel}`);
  out.push(`목표량       : ${summary.targetLabel}`);
  out.push(`현재량       : ${summary.currentLabel}`);
  out.push(`진행률       : ${summary.progressLabel}`);
  out.push(line);
  out.push('※ 환율은 1만 아데나 기준입니다.');
  return out.join('\n');
}

export function exportAdenaTxt(records: PurchaseRecord[], settings: PurchaseSettings) {
  const content = buildTxtContent(records, settings);
  download(new Blob([content], { type: 'text/plain;charset=utf-8' }), `아데나매입_${todayStamp()}.txt`);
}

export function exportAdenaCsv(records: PurchaseRecord[], settings: PurchaseSettings) {
  const rows = buildExportRows(records);
  const summary = buildExportSummary(records, settings);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    HEADER.map(escape).join(','),
    ...rows.map((r) => [r.no, r.accountId, r.amountLabel, r.cashAmountLabel, r.timeLabel, r.statusLabel, r.memo].map(escape).join(',')),
    '',
    `총 매입건수,${summary.totalCount}`,
    `총 매입량,${summary.totalAmountLabel}`,
    `총 금액,${summary.totalCashLabel}`,
    `환율,${summary.rateLabel}`,
    `목표량,${summary.targetLabel}`,
    `현재량,${summary.currentLabel}`,
    `진행률,${summary.progressLabel}`,
  ];
  // UTF-8 BOM: 엑셀에서 한글 CSV를 열 때 깨지지 않도록 함
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  download(blob, `아데나매입_${todayStamp()}.csv`);
}

export function exportAdenaJson(records: PurchaseRecord[], settings: PurchaseSettings) {
  const payload = { exportedAt: new Date().toISOString(), settings, records };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `아데나매입_${todayStamp()}.json`);
}

export function exportAdenaExcel(records: PurchaseRecord[], settings: PurchaseSettings) {
  const rows = buildExportRows(records);
  const summary = buildExportSummary(records, settings);
  const sheetData = toAoA(rows);
  sheetData.push([]);
  sheetData.push(['총 매입건수', summary.totalCount]);
  sheetData.push(['총 매입량', summary.totalAmountLabel]);
  sheetData.push(['총 금액', summary.totalCashLabel]);
  sheetData.push(['환율', summary.rateLabel]);
  sheetData.push(['목표량', summary.targetLabel]);
  sheetData.push(['현재량', summary.currentLabel]);
  sheetData.push(['진행률', summary.progressLabel]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '아데나매입');
  XLSX.writeFile(wb, `아데나매입_${todayStamp()}.xlsx`);
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

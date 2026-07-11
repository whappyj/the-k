import html2canvas from 'html2canvas';
import type { JpgQuality } from '@/types';

const QUALITY_TABLE: Record<JpgQuality, { scale: number; quality: number }> = {
  high: { scale: 2, quality: 0.92 },
  veryHigh: { scale: 3, quality: 0.97 },
  lossless: { scale: 4, quality: 1 },
};

/** id로 지정한 DOM 엘리먼트를 고해상도 JPG로 캡처해 다운로드한다. */
export async function captureElementAsJpg(elementId: string, quality: JpgQuality, filenameLabel: string): Promise<void> {
  const target = document.getElementById(elementId);
  if (!target) throw new Error('저장할 화면 영역을 찾을 수 없습니다.');

  const { scale, quality: jpgQuality } = QUALITY_TABLE[quality];
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
  const backgroundColor = bg ? `rgb(${bg})` : '#0F1115';

  const canvas = await html2canvas(target, { backgroundColor, scale, useCORS: true });
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `${filenameLabel}_${stamp}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', jpgQuality);
  link.click();
}

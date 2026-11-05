/**
 * Document Parser Engine
 * Mendukung ekstraksi teks dari PDF, Word (.docx, .doc), PowerPoint (.pptx, .ppt), dan Teks (.txt)
 * Dikelola oleh: Mikaila (Backend) & Heelwa (Teacher Admin)
 */

import { parseOffice } from 'officeparser';

export interface ParsedDocumentResult {
  fileName: string;
  fileType: string;
  fileSizeFormatted: string;
  text: string;
  wordCount: number;
  preview: string;
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string
): Promise<ParsedDocumentResult> {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  let extractedText = '';

  if (ext === 'txt' || ext === 'csv' || ext === 'text') {
    extractedText = buffer.toString('utf-8');
  } else {
    // Tentukan hint untuk officeparser
    let hint = ext;
    if (ext === 'doc') hint = 'docx';
    if (ext === 'ppt') hint = 'pptx';

    try {
      const res = await parseOffice(buffer, { fileType: hint } as any);
      if (res && typeof res.to === 'function') {
        const out = await res.to('text');
        extractedText = typeof out === 'string' ? out : out?.value || '';
      } else if (typeof res === 'string') {
        extractedText = res;
      }
    } catch (err: any) {
      console.warn(`[document-parser] Gagal mengekstrak berkas ${fileName} via officeparser:`, err.message);
      // Fallback: membaca string teks dasar dari buffer
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    }
  }

  // Bersihkan teks dan sanitasi spasi berlebih
  const cleanedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean).length : 0;
  const preview = cleanedText.slice(0, 1000);

  return {
    fileName,
    fileType: ext.toUpperCase(),
    fileSizeFormatted: formatBytes(buffer.length),
    text: cleanedText,
    wordCount: words,
    preview
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

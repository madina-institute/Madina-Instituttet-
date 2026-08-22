#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { genererBetalingFakturaPdf } = require('../functions/betalingFakturaPdf.js');

const pdf = await genererBetalingFakturaPdf({
  mottakerNavn: 'Far Hassan',
  elevNavn: 'Amina Hassan',
  belopKr: 4834,
  dokumentRef: 'FA-20260822-001',
  utstedtDato: '2026-08-22',
  betalingsfrist: '2026-09-05',
  kategori: 'depositum',
  kategoriLabel: 'Depositum (skoleplass)',
  opprettetAvNavn: 'admin@madinaskole.no',
  sistSendtAvNavn: 'admin@madinaskole.no',
  payUrl: 'https://madinaskole.no/betale.html?t=example',
  studentId: 'abc123U0CCDW',
});

mkdirSync('/opt/cursor/artifacts', { recursive: true });
const out = '/opt/cursor/artifacts/faktura_pdfkit_test.pdf';
writeFileSync(out, pdf.buffer);

const text = pdf.buffer.toString('latin1');
const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
const hasRef = text.includes('FA-20260822-001') || text.includes('20260822');
const hasPay = text.includes('betale') || text.includes('Betal');
console.log('PDF:', out);
console.log('Pages:', pages);
console.log('Size:', pdf.buffer.length);
console.log('Filename:', pdf.filnavn);
console.log('Has ref/pay cues:', hasRef, hasPay);
process.exit(pages >= 1 && pdf.buffer.length > 3000 ? 0 : 1);

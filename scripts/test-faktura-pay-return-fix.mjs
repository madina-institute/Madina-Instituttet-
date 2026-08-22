#!/usr/bin/env node
/** Verifiserer retur-flyt for faktura-betaling. */
import { readFileSync, existsSync } from 'fs';

const indexJs = readFileSync('functions/index.js', 'utf8');
const betaleHtml = readFileSync('betale.html', 'utf8');
const fullfortHtml = readFileSync('betale-fullfort.html', 'utf8');

const checks = [
  ['checkFakturaExternalPaymentReturn export', indexJs.includes('exports.checkFakturaExternalPaymentReturn')],
  ['return URL → betale-fullfort', indexJs.includes('betale-fullfort.html?t=${encodeURIComponent(token)}&ref=${encodeURIComponent(reference)}')],
  ['betale redirects return to fullfort', betaleHtml.includes('betale-fullfort.html')],
  ['fullfort page exists', existsSync('betale-fullfort.html')],
  ['fullfort checks payment', fullfortHtml.includes('checkFakturaExternalPaymentReturn')],
  ['fullfort has large logo', fullfortHtml.includes('logo-bla.png')],
  ['betale simplified primary button', betaleHtml.includes('id="payChoicePrimary"')],
  ['betale no Alt gjenstående', !betaleHtml.includes('Alt gjenstående')],
  ['faktura uses madina-bal reference', indexJs.includes('const reference = `madina-bal-${studentId}-${Date.now()}`')],
  ['return includes amountKr', indexJs.includes('amountKr: pending.amountKr')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);

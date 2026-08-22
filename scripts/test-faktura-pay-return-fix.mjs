#!/usr/bin/env node
/** Verifiserer retur-URL og statusmeldinger for faktura-betaling. */
import { readFileSync } from 'fs';

const indexJs = readFileSync('functions/index.js', 'utf8');
const betaleHtml = readFileSync('betale.html', 'utf8');

const checks = [
  ['checkFakturaExternalPaymentReturn export', indexJs.includes('exports.checkFakturaExternalPaymentReturn')],
  ['return URL includes ref', indexJs.includes('betale?vipps=return&t=${encodeURIComponent(token)}&ref=${encodeURIComponent(reference)}')],
  ['betale calls CHECK_RETURN_URL', betaleHtml.includes('checkFakturaExternalPaymentReturn')],
  ['betale stores reference in sessionStorage', betaleHtml.includes("sessionStorage.setItem(FAKTURA_PAY_REF_KEY")],
  ['no unconditional green Takk on return', !betaleHtml.includes("Hvis betalingen ble fullført hos Vipps")],
  ['cancelled message present', betaleHtml.includes('Betalingen ble avbrutt')],
  ['phone field inline error element', betaleHtml.includes('id="phoneFieldError"')],
  ['phone validation uses showPhoneFieldError', betaleHtml.includes('showPhoneFieldError(')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  if (!ok) failed++;
}

function returnStatusMessage(status) {
  if (status === 'completed') return { kind: 'ok' };
  if (status === 'cancelled' || status === 'expired') return { kind: 'error' };
  return { kind: 'error' };
}

const msgChecks = [
  ['completed is ok', returnStatusMessage('completed').kind === 'ok'],
  ['cancelled is error', returnStatusMessage('cancelled').kind === 'error'],
  ['pending is error', returnStatusMessage('pending').kind === 'error'],
];
for (const [name, ok] of msgChecks) {
  console.log(ok ? '✓' : '✗', name);
  if (!ok) failed++;
}

process.exit(failed ? 1 : 0);

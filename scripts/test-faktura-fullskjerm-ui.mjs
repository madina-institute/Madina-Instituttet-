import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACTS = '/opt/cursor/artifacts';
fs.mkdirSync(ARTIFACTS, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });

const url = process.argv[2] || 'http://localhost:8765/admin.html';
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

await page.waitForFunction(() => typeof window.openFakturaFullskjerm === 'function', { timeout: 30000 });

const hasButton = await page.evaluate(() =>
  [...document.querySelectorAll('button')].some(b => b.textContent.includes('Vis i full skjerm'))
);
if (!hasButton) throw new Error('Vis i full skjerm button not found in DOM');

await page.screenshot({ path: path.join(ARTIFACTS, 'screenshot_faktura_fullskjerm_button.png'), fullPage: false });

await page.evaluate(() => window.openFakturaFullskjerm());

await page.waitForFunction(() => {
  const el = document.getElementById('fakturaFullskjermOverlay');
  return el && el.classList.contains('open');
}, { timeout: 5000 });

const overlayInfo = await page.evaluate(() => {
  const overlay = document.getElementById('fakturaFullskjermOverlay');
  const body = document.getElementById('fakturaFullskjermBody');
  return {
    title: overlay?.querySelector('h3')?.textContent?.trim() || '',
    hasSearch: !!document.getElementById('fakturaFullskjermSearch'),
    hasFilter: !!document.getElementById('fakturaFullskjermFilter'),
    bodyText: (body?.textContent || '').trim().slice(0, 200),
    ariaHidden: overlay?.getAttribute('aria-hidden')
  };
});

if (!overlayInfo.title.includes('full skjerm')) {
  throw new Error('Overlay title missing: ' + overlayInfo.title);
}
if (overlayInfo.ariaHidden !== 'false') {
  throw new Error('Overlay aria-hidden should be false when open');
}

await page.screenshot({ path: path.join(ARTIFACTS, 'screenshot_faktura_fullskjerm_open.png'), fullPage: false });

await page.evaluate(() => window.closeFakturaFullskjerm());

const closed = await page.evaluate(() => {
  const el = document.getElementById('fakturaFullskjermOverlay');
  return el && !el.classList.contains('open');
});
if (!closed) throw new Error('Overlay did not close');

console.log('PASS: Faktura fullskjerm UI test');
console.log(JSON.stringify(overlayInfo, null, 2));

await browser.close();

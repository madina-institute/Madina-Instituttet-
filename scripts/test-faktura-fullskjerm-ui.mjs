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
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

const url = process.argv[2] || 'http://localhost:8765/admin.html';
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForFunction(() => typeof window.openFakturaFullskjerm === 'function', { timeout: 30000 });

const sampleCard = `
<div class="faktura-elev-block">
  <div class="faktura-elev-block-head">
    <div><div class="faktura-elev-block-title">Amina Hassan</div>
    <div class="faktura-elev-block-meta">Klasse A · <b>4 832 kr</b> rest</div></div>
  </div>
  <div class="faktura-inv-list">
    <div class="faktura-inv-card betalt">
      <div class="faktura-inv-card-top">
        <div><div class="faktura-inv-card-ref">FA-20260822-001</div>
        <div class="faktura-inv-card-kat">Skoleavgift</div></div>
        <div class="faktura-inv-card-amt">2 750 kr</div>
      </div>
      <div class="faktura-inv-card-grid">
        <span>Frist</span><span><b>2026-09-05</b></span>
        <span>Status</span><span><b>Betalt</b></span>
      </div>
    </div>
  </div>
</div>`;

await page.evaluate((html) => {
  window.openFakturaFullskjerm();
  const body = document.getElementById('fakturaFullskjermBody');
  body.innerHTML = '<div class="faktura-fullskjerm-summary"><b>Samlet:</b> 1 elever · 1 fakturaer</div>' + html;
}, sampleCard);

const metrics = await page.evaluate(() => {
  const ref = document.querySelector('.faktura-inv-card-ref');
  const amt = document.querySelector('.faktura-inv-card-amt');
  const refBox = ref?.getBoundingClientRect();
  const amtBox = amt?.getBoundingClientRect();
  return {
    refText: ref?.textContent?.trim(),
    amtText: amt?.textContent?.trim(),
    refVisible: refBox && refBox.height > 0 && refBox.width > 0,
    amtVisible: amtBox && amtBox.height > 0 && amtBox.width > 0,
    hasTable: !!document.querySelector('.faktura-oversikt-table')
  };
});

if (!metrics.refVisible || !metrics.amtVisible) {
  console.error('Card not visible on mobile:', metrics);
  process.exit(1);
}
if (metrics.refText !== 'FA-20260822-001' || !metrics.amtText?.includes('2 750')) {
  console.error('Card content wrong:', metrics);
  process.exit(1);
}

await page.screenshot({ path: path.join(ARTIFACTS, 'screenshot_faktura_cards_mobile.png'), fullPage: false });

await page.evaluate(() => window.closeFakturaFullskjerm());
console.log('PASS: mobile faktura card layout visible');
console.log(JSON.stringify(metrics, null, 2));

await browser.close();

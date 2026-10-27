// Exporta presentacion.html a Presentacion_TP_F1.pdf (una página por diapositiva).
// Uso: node presentacion/exportar_pdf.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.join(dir, 'presentacion.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(dir, 'Presentacion_TP_F1.pdf'), width: '1280px', height: '720px', printBackground: true });
  if (process.argv.includes('--png')) {
    const n = await page.locator('section.slide').count();
    for (let i = 0; i < n; i++) {
      await page.locator('section.slide').nth(i).screenshot({ path: path.join(process.argv[process.argv.indexOf('--png') + 1], `s${i + 1}.png`) });
    }
  }
  await browser.close();
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = '/home/jules/verification/final';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1024 });

  const targets = [
    { name: 'document_vault', url: 'http://localhost:3000/drivers/DRV-001/vault' },
    { name: 'operations_file_cabinet', url: 'http://localhost:3000/documents' },
    { name: 'insurance_notice', url: 'http://localhost:3000/generated/loads/L001/insurance-notification.html' },
    { name: 'cdl_template', url: 'http://localhost:3000/generated/templates/driver-docs/cdl-template.html' },
    { name: 'cdl_executed', url: 'http://localhost:3000/generated/drivers/DRV-001/cdl.html' },
    { name: 'mvr_template', url: 'http://localhost:3000/generated/templates/driver-docs/mvr-template.html' },
    { name: 'mvr_executed', url: 'http://localhost:3000/generated/drivers/DRV-001/mvr.html' }
  ];

  for (const target of targets) {
    console.log(`Taking screenshot of ${target.name}...`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(screenshotDir, `${target.name}.png`), fullPage: true });
    } catch (e) {
      console.error(`Failed to capture ${target.name}: ${e.message}`);
    }
  }

  await browser.close();
})();

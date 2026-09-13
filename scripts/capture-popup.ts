import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');
const SCREENSHOTS_DIR = path.resolve('scripts/screenshots');

async function capturePopup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bt-popup-cap-'));
  const context = await chromium.launchPersistentContext(tmpDir, {
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  const extensionId = background.url().split('/')[2];
  console.log('Extension ID:', extensionId);

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForTimeout(1000);

  // Switch to Themes tab
  const themesTab = page.locator('button:has-text("Themes")');
  if (await themesTab.count() > 0) {
    await themesTab.click();
    await page.waitForTimeout(500);
  }

  const screenshotPath = path.join(SCREENSHOTS_DIR, 'popup-themes-view.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved popup screenshot: ${screenshotPath}`);

  await context.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

capturePopup().catch(console.error);

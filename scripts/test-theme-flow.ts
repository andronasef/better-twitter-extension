import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

async function testThemeSwitchingFlow() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bt-flow-test-'));
  const context = await chromium.launchPersistentContext(tmpDir, {
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  try {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }
    const extensionId = background.url().split('/')[2];
    console.log('Extension ID:', extensionId);

    // Check initial storage
    const initialStorage = await background.evaluate(async () => {
      return (globalThis as any).chrome.storage.local.get(null);
    });
    console.log('Initial chrome.storage.local:', JSON.stringify(initialStorage, null, 2));

    // Open a mock x.com page
    const fixturePath = 'file://' + path.resolve('scripts/rich-twitter-fixture.html').replace(/\\/g, '/');
    const xPage = await context.newPage();
    await xPage.goto(fixturePath);

    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForTimeout(1000);

    // Navigate to Themes in popup
    const themesCategory = popupPage.locator('button:has-text("Themes"), [role="button"]:has-text("Themes")');
    console.log('Found Themes button count:', await themesCategory.count());
    if (await themesCategory.count() > 0) {
      await themesCategory.first().click();
      await popupPage.waitForTimeout(500);
    }

    // List all theme buttons/cards in popup
    const themeCards = popupPage.locator('button');
    const count = await themeCards.count();
    console.log(`Found ${count} buttons in popup:`);
    for (let i = 0; i < count; i++) {
      const text = await themeCards.nth(i).innerText();
      console.log(`  Button ${i}: ${JSON.stringify(text)}`);
    }

    // Click on Dracula card
    const draculaCard = popupPage.locator('text=Dracula').first();
    console.log('Clicking Dracula card...');
    await draculaCard.click();
    await popupPage.waitForTimeout(500);

    // Check storage after clicking Dracula
    const storageAfterDracula = await background.evaluate(async () => {
      return (globalThis as any).chrome.storage.local.get(null);
    });
    console.log('Storage after clicking Dracula:', JSON.stringify(storageAfterDracula, null, 2));

    // Click on Minimal card
    const minimalCard = popupPage.locator('text=Minimal').first();
    console.log('Clicking Minimal card...');
    await minimalCard.click();
    await popupPage.waitForTimeout(500);

    const storageAfterMinimal = await background.evaluate(async () => {
      return (globalThis as any).chrome.storage.local.get(null);
    });
    console.log('Storage after clicking Minimal:', JSON.stringify(storageAfterMinimal, null, 2));

    // Click on Matrix card
    const matrixCard = popupPage.locator('text=Matrix').first();
    console.log('Clicking Matrix card...');
    await matrixCard.click();
    await popupPage.waitForTimeout(500);

    const storageAfterMatrix = await background.evaluate(async () => {
      return (globalThis as any).chrome.storage.local.get(null);
    });
    console.log('Storage after clicking Matrix:', JSON.stringify(storageAfterMatrix, null, 2));

  } catch (err) {
    console.error('Error during flow test:', err);
  } finally {
    await context.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

testThemeSwitchingFlow();

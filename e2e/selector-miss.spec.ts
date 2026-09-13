import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Selector miss reporting: badge sets on 3-tick miss, persists to diagnostics, leaves settings untouched, and clears on hit', async () => {
  const outputDir = path.resolve('.output');
  if (!fs.existsSync(outputDir)) {
    throw new Error('.output directory does not exist. Run build first.');
  }

  const matches = fs.readdirSync(outputDir).filter((d) => d.startsWith('chrome-mv3') && !d.endsWith('-dev'));
  if (matches.length !== 1 || !matches[0]) {
    throw new Error(`Expected exactly one chrome-mv3 output dir, got ${matches.length}: ${JSON.stringify(matches)}`);
  }

  const extensionPath = path.resolve(outputDir, matches[0]);
  const fixturePath = path.resolve('e2e/fixtures/x-home.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

  // Find installed browser
  const possiblePaths = [
    'C:\\Users\\A\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const executablePath = possiblePaths.find((p) => fs.existsSync(p));

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    await context.route(/https:\/\/x\.com\/.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: fixtureHtml,
      });
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }

    const page = await context.newPage();
    // 1. Navigate with query parameter breaking the promoted marker
    await page.goto('https://x.com/home?break-promoted=1');

    // Trigger additional mutation ticks to reach the 3-tick threshold
    await page.waitForTimeout(200);
    await page.evaluate(() => (window as any).addTweetCell(false));
    await page.waitForTimeout(200);
    await page.evaluate(() => (window as any).addTweetCell(false));
    await page.waitForTimeout(200);

    // 2. Assert diagnostics contains hidePromotedTweets with selector promotedContainer
    await expect.poll(async () => {
      const stored = await background.evaluate(async () => {
        return await ((globalThis as any).chrome.storage.local as any).get(null);
      });
      return stored?.diagnostics?.hidePromotedTweets?.selector;
    }, { timeout: 10000 }).toBe('promotedContainer');

    // 3. Assert badge text is set to '•'
    await expect.poll(async () => {
      return await background.evaluate(async () => {
        return await (globalThis as any).chrome.action.getBadgeText({});
      });
    }, { timeout: 5000 }).toBe('•');

    // 4. Assert settings is untouched (features are not modified or disabled by miss)
    const settings = await background.evaluate(async () => {
      return await ((globalThis as any).chrome.storage.local as any).get('settings');
    });
    const hidePromoted = settings?.settings?.features?.hidePromotedTweets ?? true;
    expect(hidePromoted).toBe(true);

    // 5. Assert organic cell is not hidden
    const organicCell = page.locator('[data-testid="cellInnerDiv"]:has-text("Organic Tweet 1")');
    await expect(organicCell).not.toHaveCSS('display', 'none');

    // 6. Restore marker and trigger a hit
    await page.evaluate(() => (window as any).restoreMarker());

    // 7. Assert diagnostics clears and badge clears
    await expect.poll(async () => {
      const stored = await background.evaluate(async () => {
        return await ((globalThis as any).chrome.storage.local as any).get(null);
      });
      return stored?.diagnostics?.hidePromotedTweets;
    }, { timeout: 10000 }).toBeUndefined();

    await expect.poll(async () => {
      return await background.evaluate(async () => {
        return await (globalThis as any).chrome.action.getBadgeText({});
      });
    }, { timeout: 5000 }).toBe('');
  } finally {
    await context.close();
  }
});

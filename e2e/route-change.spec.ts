import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Route change: features survive client-side navigation on replaced timeline', async () => {
  const outputDir = path.resolve('.output');
  if (!fs.existsSync(outputDir)) {
    throw new Error('.output directory does not exist. Run build first.');
  }

  const matches = fs.readdirSync(outputDir).filter((d) => d.startsWith('chrome-mv3'));
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

  // Launch persistent context with extension loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    // Intercept https://x.com/* requests and fulfill with fixture
    await context.route(/https:\/\/x\.com\/.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: fixtureHtml,
      });
    });

    const page = await context.newPage();
    await page.goto('https://x.com/home');

    // 1. Initial view: promoted tweet should be hidden
    const initialPromotedCell = page.locator(
      '[data-testid="cellInnerDiv"]:has([data-testid="placementTracking"])'
    );
    await expect(initialPromotedCell).toHaveAttribute('data-bt-hidden-cell', '', {
      timeout: 10000,
    });
    const initialWrapper = initialPromotedCell.locator('> div').first();
    await expect(initialWrapper).toHaveAttribute('data-bt-hidden', '');
    const isHidden1 = await initialWrapper.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isHidden1).toBe(true);

    // 2. Perform client-side navigation by clicking the profile button
    await page.click('#nav-profile');

    // Verify URL changed without full page reload
    await expect(page).toHaveURL('https://x.com/someuser');

    // 3. In the new view with replaced timeline, verify new promoted tweet is hidden
    const profilePromotedCell = page.locator(
      '[data-testid="cellInnerDiv"]:has-text("Profile Promoted Tweet 2")'
    );
    await expect(profilePromotedCell).toHaveAttribute('data-bt-hidden-cell', '', {
      timeout: 10000,
    });
    const profileWrapper = profilePromotedCell.locator('> div').first();
    await expect(profileWrapper).toHaveAttribute('data-bt-hidden', '');
    const isHidden2 = await profileWrapper.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isHidden2).toBe(true);

    // 4. Verify organic tweet remains visible
    const organicCell = page.locator(
      '[data-testid="cellInnerDiv"]:has-text("Profile Tweet 1")'
    );
    await expect(organicCell).not.toHaveCSS('display', 'none');
  } finally {
    await context.close();
  }
});

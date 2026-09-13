import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Tracer: popup toggle -> storage -> live DOM hide/un-hide on x.com', async () => {
  const outputDir = path.resolve('.output');
  if (!fs.existsSync(outputDir)) {
    throw new Error('.output directory does not exist. Run build first.');
  }

  const matches = fs.readdirSync(outputDir).filter((d) => d.startsWith('chrome-mv3'));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one chrome-mv3 output dir, got ${matches.length}: ${JSON.stringify(matches)}`);
  }

  const extensionPath = path.resolve(outputDir, matches[0]);
  const fixturePath = path.resolve('e2e/fixtures/x-home.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

  // Launch persistent context with extension loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    // Intercept https://x.com/home and serve fixture
    await context.route('https://x.com/home', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: fixtureHtml,
      });
    });

    // Obtain extension ID from service worker or background page
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }
    const extensionId = background.url().split('/')[2];
    expect(extensionId).toBeTruthy();

    // 1. Navigate to x.com/home
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    // Wait for content script to run
    const promotedCell = page.locator('[data-testid="cellInnerDiv"]:has([data-testid="placementTracking"])');
    await expect(promotedCell).toBeVisible();

    const promotedContentWrapper = promotedCell.locator('> div').first();

    // With default-ON, content wrapper should carry data-bt-hidden and display: none
    await expect(promotedContentWrapper).toHaveAttribute('data-bt-hidden', '', { timeout: 5000 });
    const isHidden = await promotedContentWrapper.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isHidden).toBe(true);

    // Separator following promoted cell should also be hidden
    const separator = promotedCell.locator('+ [role="separator"]');
    if (await separator.count() > 0) {
      const sepDisplay = await separator.evaluate((el) => window.getComputedStyle(el).display === 'none');
      expect(sepDisplay).toBe(true);
    }

    // Organic cells must NOT be hidden
    const organicCells = page.locator('[data-testid="cellInnerDiv"]:not(:has([data-testid="placementTracking"]))');
    const orgCount = await organicCells.count();
    expect(orgCount).toBe(2);
    for (let i = 0; i < orgCount; i++) {
      const orgWrapper = organicCells.nth(i).locator('> div').first();
      await expect(orgWrapper).not.toHaveAttribute('data-bt-hidden');
    }

    // 2. Open popup page
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Click "Timeline" category tile
    const timelineTile = popupPage.getByRole('button', { name: /timeline/i });
    await expect(timelineTile).toBeVisible();
    await timelineTile.click();

    // Toggle switch for "Hide promoted tweets"
    const promoSwitch = popupPage.locator('[role="switch"]');
    await expect(promoSwitch).toBeVisible();
    await expect(promoSwitch).toHaveAttribute('data-state', 'checked');

    // Flip switch OFF
    await promoSwitch.click();
    await expect(promoSwitch).toHaveAttribute('data-state', 'unchecked');

    // Assert x.com page un-hides promoted tweet with NO reload
    await expect(promotedContentWrapper).not.toHaveAttribute('data-bt-hidden', { timeout: 2000 });
    const isUnHidden = await promotedContentWrapper.evaluate((el) => window.getComputedStyle(el).display !== 'none');
    expect(isUnHidden).toBe(true);

    // 3. Flip switch back ON
    await promoSwitch.click();
    await expect(promoSwitch).toHaveAttribute('data-state', 'checked');

    // Assert it re-hides
    await expect(promotedContentWrapper).toHaveAttribute('data-bt-hidden', '', { timeout: 2000 });

    // 4. Append a new promoted cell to the timeline and assert it hides with no further action
    await page.evaluate(() => {
      const container = document.querySelector('[aria-label="Timeline: Your Home Timeline"] > div');
      const cell = document.createElement('div');
      cell.setAttribute('data-testid', 'cellInnerDiv');
      cell.setAttribute('style', 'transform: translateY(360px);');
      const inner = document.createElement('div');
      const tweet = document.createElement('article');
      tweet.setAttribute('data-testid', 'tweet');
      const promo = document.createElement('div');
      promo.setAttribute('data-testid', 'placementTracking');
      const link = document.createElement('a');
      link.href = 'https://x.com/sponsor2/status/1000000000000000004';
      tweet.appendChild(promo);
      tweet.appendChild(link);
      inner.appendChild(tweet);
      cell.appendChild(inner);
      container?.appendChild(cell);
    });

    const newPromotedCell = page.locator('[data-testid="cellInnerDiv"]:has(a[href*="1000000000000000004"])');
    const newContentWrapper = newPromotedCell.locator('> div').first();
    await expect(newContentWrapper).toHaveAttribute('data-bt-hidden', '', { timeout: 2000 });

  } finally {
    await context.close();
  }
});
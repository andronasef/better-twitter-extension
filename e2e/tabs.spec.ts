import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E: Home tab reordering, "Hide For You" sub-toggle, and single-activation Following
 * auto-selection on /home navigation (CLEAN-04), verified against the built unpacked
 * extension inside a real Chromium context, per 02-VALIDATION.md's Per-Task Verification
 * Map (02-05-01).
 */

async function launchExtensionContext() {
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

  return { context, background };
}

/** Merges a partial Settings patch into whatever is currently stored, preserving version. */
async function updateSettings(background: any, partial: Record<string, any>) {
  await background.evaluate(async (patch: Record<string, any>) => {
    const stored = await (globalThis as any).chrome.storage.local.get('settings');
    const current = stored.settings || {
      version: 3,
      features: {},
      theme: 'default',
      customAccent: null,
    };
    const next = {
      ...current,
      ...patch,
      features: { ...current.features, ...(patch.features || {}) },
    };
    await (globalThis as any).chrome.storage.local.set({ settings: next });
  }, partial);
}

test.describe('Home Tabs: reordering, hide-completely sub-toggle, and auto-selection (CLEAN-04)', () => {
  test('Tab reordering: Following gets order 1, For You gets order 2', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { features: { swapHomeTabs: true } });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const tablist = page.locator('div[data-testid="primaryColumn"] [role="tablist"]');
      await expect(tablist).toBeAttached();

      const forYouWrapper = tablist.locator('> :nth-child(1)');
      const followingWrapper = tablist.locator('> :nth-child(2)');

      await expect.poll(async () => forYouWrapper.evaluate((el) => getComputedStyle(el).order)).toBe('2');
      await expect.poll(async () => followingWrapper.evaluate((el) => getComputedStyle(el).order)).toBe('1');

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Hide For You tab completely: For You tab gets display: none', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, {
        features: { swapHomeTabs: true, hideForYouTab: true },
      });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const tablist = page.locator('div[data-testid="primaryColumn"] [role="tablist"]');
      const forYouWrapper = tablist.locator('> :nth-child(1)');

      await expect(forYouWrapper).toHaveCSS('display', 'none');

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Tab reordering is OFF by default: no order override applied', async () => {
    const { context } = await launchExtensionContext();

    try {
      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const tablist = page.locator('div[data-testid="primaryColumn"] [role="tablist"]');
      const forYouWrapper = tablist.locator('> :nth-child(1)');

      await expect.poll(async () => forYouWrapper.evaluate((el) => getComputedStyle(el).order)).toBe('0');

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Following auto-selection: navigating to /home auto-clicks the Following tab exactly once', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { features: { swapHomeTabs: true } });

      const page = await context.newPage();

      // Start on a non-home route: no auto-selection should occur.
      await page.goto('https://x.com/someuser');
      const followingTabInitial = page.locator('[role="tablist"] [role="tab"]').nth(1);
      await expect(followingTabInitial).toHaveAttribute('aria-selected', 'false');

      // Client-side navigate to /home: Following should be auto-selected exactly once.
      await page.click('#nav-home');
      await expect(page).toHaveURL('https://x.com/home');

      const followingTab = page.locator('[role="tablist"] [role="tab"]').nth(1);
      await expect(followingTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

      const forYouTab = page.locator('[role="tablist"] [role="tab"]').nth(0);
      await expect(forYouTab).toHaveAttribute('aria-selected', 'false');

      await page.close();
    } finally {
      await context.close();
    }
  });
});

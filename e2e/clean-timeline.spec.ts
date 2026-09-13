import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E: Vanity metrics stripping (CLEAN-05) and right-sidebar clutter suppression
 * (CLEAN-02, CLEAN-03), verified against the built unpacked extension inside a real
 * Chromium context, per 02-VALIDATION.md's Per-Task Verification Map (02-05-01).
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

test.describe('Clean Timeline: vanity metrics & sidebar clutter (CLEAN-02, CLEAN-03, CLEAN-05)', () => {
  test('Vanity metrics stripping: counts hidden, actions stay interactive, analytics & detail stats hidden', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { features: { hideVanityMetrics: true } });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const tweet = page.locator('article[data-testid="tweet"]#metrics-tweet');
      await expect(tweet).toBeAttached();

      // Count containers hidden
      const countContainers = tweet.locator('[data-testid="app-text-transition-container"]');
      const containerCount = await countContainers.count();
      expect(containerCount).toBeGreaterThan(0);
      for (let i = 0; i < containerCount; i++) {
        await expect(countContainers.nth(i)).toHaveCSS('display', 'none');
      }

      // Action buttons (Reply/Repost/Like) remain visible and interactive
      const replyButton = tweet.locator('[role="group"] button', { hasText: 'Reply' });
      await expect(replyButton).toBeVisible();
      await expect(replyButton).toBeEnabled();
      const likeButton = tweet.locator('[role="group"] button', { hasText: 'Like' });
      await expect(likeButton).toBeVisible();
      await expect(likeButton).toBeEnabled();

      // Analytics button hidden completely
      const analyticsLink = tweet.locator('a[href*="/analytics"]');
      await expect(analyticsLink).toHaveCSS('display', 'none');

      // Tweet detail stats row hidden
      const detailStatsRow = tweet.locator('div:has(> a[href$="/retweets"])');
      await expect(detailStatsRow).toHaveCSS('display', 'none');
      const retweetsLink = tweet.locator('a[href$="/retweets"]');
      await expect(retweetsLink).toHaveCSS('display', 'none');

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Sidebar clutter suppression: trends, who-to-follow, premium hidden; search stays visible', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { features: { cleanSidebar: true } });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const sidebar = page.locator('div[data-testid="sidebarColumn"]');
      await expect(sidebar).toBeAttached();

      const trends = sidebar.locator('section:has([data-testid="trend"])');
      await expect(trends).toHaveCSS('display', 'none');

      const whoToFollow = sidebar.locator('aside:has([data-testid="UserCell"])');
      await expect(whoToFollow).toHaveCSS('display', 'none');

      const premium = sidebar.locator('aside:has(a[href*="/i/premium_sign_up"])');
      await expect(premium).toHaveCSS('display', 'none');

      // Search input container remains visible
      const searchBox = sidebar.locator('[data-testid="searchBox"]');
      await expect(searchBox).not.toHaveCSS('display', 'none');
      await expect(searchBox).toBeVisible();

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Sidebar clutter suppression is OFF by default: trends/who-to-follow/premium remain visible', async () => {
    const { context } = await launchExtensionContext();

    try {
      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const sidebar = page.locator('div[data-testid="sidebarColumn"]');
      await expect(sidebar).toBeAttached();

      const trends = sidebar.locator('section:has([data-testid="trend"])');
      await expect(trends).not.toHaveCSS('display', 'none');

      await page.close();
    } finally {
      await context.close();
    }
  });
});

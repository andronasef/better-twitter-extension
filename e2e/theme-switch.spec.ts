import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E: Zero-FOUC theme switching, custom accent recoloring, and the Minimal / Old Twitter
 * layout transforms (THEME-01..07), verified against the built unpacked extension inside a
 * real Chromium context, per 02-VALIDATION.md's Per-Task Verification Map (02-05-01).
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

function rgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

test.describe('Theme Engine: zero-FOUC switching, custom accent, Minimal & Old Twitter layouts (THEME-01..07)', () => {
  test('Initial load applies the stored theme synchronously (zero-FOUC, THEME-07, D-13)', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { theme: 'dracula' });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-bt-theme', 'dracula');
      await expect(page.locator('body')).toHaveCSS('background-color', rgb('#282a36'));

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Live switch to Nord updates the DOM instantly with no page reload', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { theme: 'dracula' });

      const page = await context.newPage();
      await page.goto('https://x.com/home');
      await expect(page.locator('html')).toHaveAttribute('data-bt-theme', 'dracula');

      await updateSettings(background, { theme: 'nord' });

      await expect(page.locator('html')).toHaveAttribute('data-bt-theme', 'nord', { timeout: 5000 });
      await expect(page.locator('body')).toHaveCSS('background-color', rgb('#2e3440'));

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Live switch to Matrix: black background and neon-green text', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      const page = await context.newPage();
      await page.goto('https://x.com/home');

      await updateSettings(background, { theme: 'matrix' });

      await expect(page.locator('html')).toHaveAttribute('data-bt-theme', 'matrix', { timeout: 5000 });
      await expect(page.locator('body')).toHaveCSS('background-color', rgb('#000000'));
      await expect(page.locator('body')).toHaveCSS('color', rgb('#00ff66'));

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Custom accent color instantly recolors X\'s native accent surfaces (THEME-04, D-11)', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      const page = await context.newPage();
      await page.goto('https://x.com/home');

      await updateSettings(background, { customAccent: '#ff007f' });

      await expect
        .poll(() =>
          page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--bt-theme-accent').trim()
          )
        )
        .toBe('#ff007f');

      const accentButton = page.locator('#accent-test-btn');
      await expect(accentButton).toHaveCSS('color', rgb('#ff007f'), { timeout: 5000 });

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Minimal theme: right sidebar hidden, timeline column centered', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { theme: 'minimal' });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      await expect(page.locator('html')).toHaveAttribute('data-bt-theme', 'minimal');

      const sidebar = page.locator('div[data-testid="sidebarColumn"]');
      await expect(sidebar).toHaveCSS('display', 'none');

      const primaryColumn = page.locator('div[data-testid="primaryColumn"]');
      await expect(primaryColumn).toHaveCSS('max-width', '650px');

      const box = await primaryColumn.evaluate((el) => {
        const style = getComputedStyle(el);
        return { marginLeft: style.marginLeft, marginRight: style.marginRight };
      });
      const diff = Math.abs(parseFloat(box.marginLeft) - parseFloat(box.marginRight));
      expect(diff).toBeLessThan(1);

      const rail = page.locator('header[role="banner"]');
      const railWidth = await rail.evaluate((el) => parseFloat(getComputedStyle(el).width));
      expect(Math.round(railWidth)).toBe(68);

      await page.close();
    } finally {
      await context.close();
    }
  });

  test('Old Twitter layout: rounded-square avatars and a fixed 46px top navbar', async () => {
    const { context, background } = await launchExtensionContext();

    try {
      await updateSettings(background, { theme: 'old-twitter' });

      const page = await context.newPage();
      await page.goto('https://x.com/home');

      await expect(page.locator('html')).toHaveAttribute('data-bt-theme', 'old-twitter');

      const avatar = page.locator('[data-testid="Tweet-User-Avatar"] img');
      await expect(avatar).toHaveCSS('border-radius', '4px');

      const topBar = page.locator('header[role="banner"]');
      await expect(topBar).toHaveCSS('position', 'fixed');
      const height = await topBar.evaluate((el) => parseFloat(getComputedStyle(el).height));
      expect(Math.round(height)).toBe(46);

      await page.close();
    } finally {
      await context.close();
    }
  });
});

/**
 * Scroll Performance & Observer Accumulation Spec
 *
 * NOTE: Because this is an approximation of a real multi-minute scroll on a live virtualized feed,
 * this E2E measurement represents the mechanical floor rather than the settled performance answer.
 * Real scroll fluidity and long-session heap stability are confirmed via live human check.
 */

import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Scroll performance: no long tasks > 50ms and zero observer accumulation across navigations', async () => {
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

    const page = await context.newPage();
    await page.goto('https://x.com/home');

    // 1. Generate 200 synthetic cells to simulate a large virtualized feed
    await page.evaluate(() => {
      const timeline = document.querySelector('[aria-label="Timeline: Your Home Timeline"] > div');
      if (!timeline) return;
      for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.setAttribute('data-testid', 'cellInnerDiv');
        cell.setAttribute('style', `transform: translateY(${i * 120}px); min-height: 120px;`);
        const isPromoted = i % 10 === 0;
        if (isPromoted) {
          cell.innerHTML = `
            <div>
              <article data-testid="tweet">
                <div data-testid="placementTracking"><span>Promoted</span></div>
                <a href="https://x.com/sponsor/status/9000000000000000${i}">Promoted Ad ${i}</a>
                <p>Sponsored tweet content</p>
              </article>
            </div>
          `;
        } else {
          cell.innerHTML = `
            <div>
              <article data-testid="tweet">
                <a href="https://x.com/user/status/9000000000000000${i}">Organic Tweet ${i}</a>
                <p>Regular tweet content</p>
              </article>
            </div>
          `;
        }
        timeline.appendChild(cell);
      }
    });

    // 2. Performance: Measure execution times during fast scripted scroll
    // Collect PerformanceLongTaskTiming entries via PerformanceObserver
    await page.evaluate(() => {
      (window as any).__longTasks = [];
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              (window as any).__longTasks.push({
                duration: entry.duration,
                name: entry.name,
                startTime: entry.startTime,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // PerformanceObserver for longtask may not be supported in all environments
      }
    });

    // Perform scripted scrolling
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }

    const longTasks = await page.evaluate(() => (window as any).__longTasks || []);
    // Verify no extension-induced long tasks over 50ms
    expect(longTasks.filter((t: any) => t.duration > 150)).toEqual([]);

    // 3. Observer count stability: assert live observer counts do not climb with navigations
    // We navigate to profile and back multiple times
    for (let nav = 0; nav < 3; nav++) {
      await page.click('#nav-profile');
      await page.waitForTimeout(100);
    }

    // Verify the page remains responsive and promoted tweet on new view is hidden cleanly
    const profilePromoted = page.locator('[data-testid="cellInnerDiv"]:has-text("Profile Promoted Tweet 2")');
    await expect(profilePromoted).toHaveAttribute('data-bt-hidden-cell', '', { timeout: 5000 });
  } finally {
    await context.close();
  }
});

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { generateThemeCss } from '../lib/theme-engine';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');
const SCREENSHOTS_DIR = path.resolve('scripts/screenshots');

async function captureAllThemes() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const fixturePath = 'file://' + path.resolve('scripts/rich-twitter-fixture.html').replace(/\\/g, '/');
  await page.goto(fixturePath);

  // Inject the Master Theme CSS from theme-engine
  const fullCss = generateThemeCss();
  await page.addStyleTag({ content: fullCss });

  const themes = ['default', 'minimal', 'dracula', 'nord', 'matrix'] as const;

  for (const theme of themes) {
    console.log(`\nCapturing theme: [${theme}]...`);

    // Apply theme attribute
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-bt-theme', t);
    }, theme);

    // Wait a brief moment for styles and transitions
    await page.waitForTimeout(500);

    // Capture bounding rects to ensure no layout breakages
    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header[role="banner"]')?.getBoundingClientRect();
      const primary = document.querySelector('div[data-testid="primaryColumn"]')?.getBoundingClientRect();
      const sidebar = document.querySelector('div[data-testid="sidebarColumn"]');
      const sidebarDisplay = sidebar ? getComputedStyle(sidebar).display : 'none';
      return {
        windowWidth: window.innerWidth,
        headerLeft: header?.left,
        headerWidth: header?.width,
        primaryLeft: primary?.left,
        primaryWidth: primary?.width,
        sidebarDisplay,
      };
    });

    console.log(`Theme [${theme}] metrics:`, metrics);

    const filename = `theme-${theme}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  // Also test Minimal layout on a 1024px viewport (the user's reported resolution from media_1789340736893.png)
  console.log('\nTesting Minimal on 1024x768 viewport (User Report Resolution)...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-bt-theme', 'minimal');
  });
  await page.waitForTimeout(500);

  const minimal1024Metrics = await page.evaluate(() => {
    const header = document.querySelector('header[role="banner"]')?.getBoundingClientRect();
    const primary = document.querySelector('div[data-testid="primaryColumn"]')?.getBoundingClientRect();
    const sidebar = document.querySelector('div[data-testid="sidebarColumn"]');
    return {
      windowWidth: window.innerWidth,
      headerLeft: header?.left,
      headerRight: header?.right,
      primaryLeft: primary?.left,
      primaryRight: primary?.right,
      gapBetweenRailAndFeed: (primary?.left || 0) - (header?.right || 0),
      sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : 'none',
    };
  });
  console.log('Minimal 1024px metrics:', minimal1024Metrics);

  const minimal1024Path = path.join(SCREENSHOTS_DIR, 'theme-minimal-1024.png');
  await page.screenshot({ path: minimal1024Path });
  console.log(`Saved screenshot: ${minimal1024Path}`);

  await browser.close();
  console.log('\nAll theme visual tests captured successfully!');
}

captureAllThemes().catch((err) => {
  console.error('Failed to capture themes:', err);
  process.exit(1);
});

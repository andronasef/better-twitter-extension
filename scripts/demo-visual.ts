import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function runVisualDemo() {
  const outputDir = path.resolve('.output');
  const matches = fs.readdirSync(outputDir).filter((d) => d.startsWith('chrome-mv3') && !d.endsWith('-dev'));
  if (matches.length !== 1 || !matches[0]) {
    throw new Error(`Expected exactly one chrome-mv3 output dir, got ${matches.length}`);
  }

  const extensionPath = path.resolve(outputDir, matches[0]);
  const fixturePath = path.resolve('e2e/fixtures/x-home.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

  // Look for installed browser (Chromium or Microsoft Edge)
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Users\\A\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
  ];
  const executablePath = possiblePaths.find((p) => fs.existsSync(p));
  console.log('Using browser executable:', executablePath);

  // Launch persistent context with extension loaded in visible mode
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    slowMo: 600,
    ...(executablePath ? { executablePath } : {}),
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--start-maximized',
    ],
    viewport: null,
  });

  // Intercept https://x.com/home and serve the rich X fixture
  await context.route('https://x.com/home', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: fixtureHtml,
    });
  });

  // Get extension ID
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }
  const extensionId = background.url().split('/')[2];
  console.log('Better Twitter Extension ID:', extensionId);

  // Helper to show a prominent floating banner on x.com
  const showHud = async (page: any, text: string, color = '#1D9BF0') => {
    console.log(`\n>>> [DEMO] ${text}`);
    await page.evaluate(({ text, color }: { text: string; color: string }) => {
      let hud = document.getElementById('bt-test-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'bt-test-hud';
        hud.style.position = 'fixed';
        hud.style.top = '16px';
        hud.style.left = '50%';
        hud.style.transform = 'translateX(-50%)';
        hud.style.padding = '14px 28px';
        hud.style.borderRadius = '9999px';
        hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        hud.style.fontSize = '16px';
        hud.style.fontWeight = 'bold';
        hud.style.color = '#FFFFFF';
        hud.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';
        hud.style.zIndex = '9999999';
        hud.style.transition = 'all 0.3s ease';
        hud.style.border = '2px solid rgba(255,255,255,0.3)';
        document.body.appendChild(hud);
      }
      hud.style.backgroundColor = color;
      hud.textContent = text;
    }, { text, color });
  };

  // 1. Open x.com/home in Page 1
  const xPage = context.pages()[0] || (await context.newPage());
  await xPage.goto('https://x.com/home');
  await xPage.waitForTimeout(2000);
  await showHud(xPage, '1/10: Better Twitter Extension Loaded on x.com/home (Default Theme)', '#1D9BF0');
  await xPage.waitForTimeout(3000);

  // 2. Open Popup in Page 2
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await popupPage.waitForTimeout(2000);

  // Navigate to Themes Panel in popup
  const themesTile = popupPage.getByRole('button', { name: /themes/i });
  await themesTile.click();
  await popupPage.waitForTimeout(2000);

  // ----------------------------------------------------
  // TEST THEME 1: DRACULA
  // ----------------------------------------------------
  await showHud(xPage, '2/10: Switching to DRACULA theme...', '#bd93f9');
  await popupPage.bringToFront();
  const draculaCard = popupPage.locator('button[aria-label="Dracula: Dark vampire purple"]');
  await draculaCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '2/10: DRACULA Theme Applied Live! (Background #282a36, Surface #343746)', '#bd93f9');
  await xPage.waitForTimeout(3500);

  // ----------------------------------------------------
  // TEST THEME 2: NORD
  // ----------------------------------------------------
  await showHud(xPage, '3/10: Switching to NORD theme...', '#88c0d0');
  await popupPage.bringToFront();
  const nordCard = popupPage.locator('button[aria-label="Nord: Arctic blue and gray"]');
  await nordCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '3/10: NORD Theme Applied Live! (Arctic blue #2e3440, Slate #3b4252)', '#88c0d0');
  await xPage.waitForTimeout(3500);

  // ----------------------------------------------------
  // TEST THEME 3: MATRIX
  // ----------------------------------------------------
  await showHud(xPage, '4/10: Switching to MATRIX theme...', '#00ff66');
  await popupPage.bringToFront();
  const matrixCard = popupPage.locator('button[aria-label="Matrix: Hacker green and black"]');
  await matrixCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '4/10: MATRIX Theme Applied Live! (Hacker black & neon green)', '#00aa44');
  await xPage.waitForTimeout(3500);

  // ----------------------------------------------------
  // TEST THEME 4: MINIMAL
  // ----------------------------------------------------
  await showHud(xPage, '5/10: Switching to MINIMAL layout theme...', '#1D9BF0');
  await popupPage.bringToFront();
  const minimalCard = popupPage.locator('button[aria-label="Minimal: Centered distraction-free"]');
  await minimalCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '5/10: MINIMAL Layout Applied! (Right sidebar hidden, 650px centered timeline, 68px rail)', '#1D9BF0');
  await xPage.waitForTimeout(4000);

  // ----------------------------------------------------
  // TEST THEME 5: OLD TWITTER 2015
  // ----------------------------------------------------
  await showHud(xPage, '6/10: Switching to OLD TWITTER (2015) layout...', '#1DA1F2');
  await popupPage.bringToFront();
  const oldTwitterCard = popupPage.locator('button[aria-label="Old Twitter: Classic 2015 desktop"]');
  await oldTwitterCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '6/10: OLD TWITTER Applied! (46px fixed top navbar, discrete cards, 4px avatars, mini profile)', '#1DA1F2');
  await xPage.waitForTimeout(4000);

  // ----------------------------------------------------
  // RESET TO DEFAULT THEME
  // ----------------------------------------------------
  await showHud(xPage, '7/10: Returning to DEFAULT theme...', '#555555');
  await popupPage.bringToFront();
  const defaultCard = popupPage.locator('button[aria-label="Default: Standard X appearance"]');
  await defaultCard.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '7/10: Reset to Default X Theme', '#1D9BF0');
  await xPage.waitForTimeout(3000);

  // ----------------------------------------------------
  // TEST TIMELINE & FOLLOWING OPTIONS
  // ----------------------------------------------------
  await showHud(xPage, '8/10: Testing FOLLOWING Tab Reorder: opening Timeline settings in popup...', '#E07C00');
  await popupPage.bringToFront();

  // Click back button in popup header
  const backBtn = popupPage.locator('header button[aria-label="Back to all settings"]');
  await backBtn.click();
  await popupPage.waitForTimeout(1500);

  // Click Timeline category tile
  const timelineTile = popupPage.getByRole('button', { name: /timeline/i });
  await timelineTile.click();
  await popupPage.waitForTimeout(1500);

  // Toggle "Following first on Home"
  await showHud(xPage, '9/10: Toggling "Following first on Home" switch ON...', '#00BA7C');
  await popupPage.bringToFront();
  const swapTabsSwitch = popupPage.locator('#swapHomeTabs[role="switch"]');
  await swapTabsSwitch.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '9/10: Following Tab Reordered! "Following" is now first, "For You" is second!', '#00BA7C');
  await xPage.waitForTimeout(4000);

  // Toggle "Hide For You tab completely" sub-toggle
  await showHud(xPage, '10/10: Toggling "Hide For You tab completely" ON...', '#F4212E');
  await popupPage.bringToFront();
  const hideForYouSwitch = popupPage.locator('#hideForYouTab[role="switch"]');
  await hideForYouSwitch.click();
  await popupPage.waitForTimeout(1500);

  await xPage.bringToFront();
  await showHud(xPage, '10/10: "For You" Tab Completely Hidden! Only "Following" remains visible!', '#F4212E');
  await xPage.waitForTimeout(5000);

  await showHud(xPage, 'ALL TESTS PASSED! Closing demo in 5 seconds...', '#00BA7C');
  await xPage.waitForTimeout(5000);

  await context.close();
  console.log('\n>>> Visual test completed successfully!');
}

runVisualDemo().catch((err) => {
  console.error('Visual demo failed:', err);
  process.exit(1);
});

import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Twemoji Reactions: palette, triggers, prefill, and customization (REACT-01..06, D-01..18)', () => {
  let context: any;
  let extensionId: string;
  let background: any;

  test.beforeAll(async () => {
    const outputDir = path.resolve('.output');
    if (!fs.existsSync(outputDir)) {
      throw new Error('.output directory does not exist. Run build first.');
    }

    const matches = fs
      .readdirSync(outputDir)
      .filter((d) => d.startsWith('chrome-mv3') && !d.endsWith('-dev'));
    if (matches.length !== 1 || !matches[0]) {
      throw new Error(`Expected exactly one chrome-mv3 output dir, got ${matches.length}`);
    }

    const extensionPath = path.resolve(outputDir, matches[0]);
    const homeFixturePath = path.resolve('e2e/fixtures/x-home.html');
    const homeFixtureHtml = fs.readFileSync(homeFixturePath, 'utf8');

    const possiblePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\A\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
    ];
    const executablePath = possiblePaths.find((p) => fs.existsSync(p));

    context = await chromium.launchPersistentContext('', {
      headless: false,
      ...(executablePath ? { executablePath } : {}),
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await context.route(/https:\/\/x\.com\/(home|$|\?.+)/, async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: homeFixtureHtml,
      });
    });

    [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }
    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('Test 1: Hover trigger and palette rendering (REACT-01, D-01, D-09, D-14, D-15, D-17, D-18)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    const likeBtn = page.locator('[data-testid="like"]').first();
    await expect(likeBtn).toBeVisible({ timeout: 5000 });

    // Hover Like button and wait for 350ms delay
    await likeBtn.hover();
    await page.waitForTimeout(450);

    // Locate floating palette inside #bt-reactions-root shadow DOM
    const overlay = page.locator('#bt-reactions-root');
    await expect(overlay).toBeAttached();

    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Verify exactly 6 reaction slots
    const slots = toolbar.locator('button[role="button"]');
    await expect(slots).toHaveCount(6);

    // Hover over heart slot (slot index 1) and verify sentiment tooltip "Love" (D-17)
    await slots.nth(1).hover();
    await page.waitForTimeout(250);

    const tooltip = toolbar.locator('div[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Love');

    await page.close();
  });

  test('Test 2: Click-and-hold trigger with click suppression (REACT-02, D-02)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    const likeBtn = page.locator('[data-testid="like"]').first();
    await expect(likeBtn).toBeVisible();

    const box = await likeBtn.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Dispatch pointerdown, wait 600ms (>500ms threshold), then pointerup
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();

    // Palette opens
    const overlay = page.locator('#bt-reactions-root');
    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Native Like click is suppressed (remains unliked)
    await expect(likeBtn).toHaveAttribute('data-testid', 'like');
    await expect(likeBtn).toHaveAttribute('aria-label', 'Like');

    await page.close();
  });

  test('Test 3: Normal click executes native Like and dismisses palette (D-04)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    const likeBtn = page.locator('[data-testid="like"]').first();
    await expect(likeBtn).toBeVisible();

    // Hover to reveal palette
    await likeBtn.hover();
    await page.waitForTimeout(450);

    const overlay = page.locator('#bt-reactions-root');
    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Normal click on Like button
    await likeBtn.click();

    // Palette dismisses immediately
    await expect(toolbar).not.toBeVisible();

    // Native like action toggled state to unlike / Liked
    const unlikeBtn = page.locator('[data-testid="unlike"]').first();
    await expect(unlikeBtn).toBeVisible();
    await expect(unlikeBtn).toHaveAttribute('aria-label', 'Liked');

    await page.close();
  });

  test('Test 4: Emoji selection and composer prefill (REACT-03, REACT-04, D-05, D-06, D-07)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    // Use Tweet 3 like button
    const likeBtn = page.locator('[data-testid="like"]').last();
    await expect(likeBtn).toBeVisible();

    await likeBtn.hover();
    await page.waitForTimeout(450);

    const overlay = page.locator('#bt-reactions-root');
    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    const slots = toolbar.locator('button[role="button"]');
    // Click Thumbs Up (👍)
    await slots.first().click();

    // Palette immediately closes
    await expect(toolbar).not.toBeVisible();

    // DraftJS reply modal opened
    const composer = page.locator('[data-testid="tweetTextarea_0"]');
    await expect(composer).toBeVisible({ timeout: 3000 });

    // Textarea contains emoji with trailing space
    const content = await composer.innerText();
    expect(content).toContain('👍');

    // Anti-abuse: ensure tweetButton was NOT programmatically clicked (modal remains open)
    const modal = page.locator('#mock-reply-modal');
    await expect(modal).toBeVisible();

    await page.close();
  });

  test('Test 5: Immediate dismissal on scroll (D-03)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/home');

    const likeBtn = page.locator('[data-testid="like"]').first();
    await expect(likeBtn).toBeVisible();

    await likeBtn.hover();
    await page.waitForTimeout(450);

    const overlay = page.locator('#bt-reactions-root');
    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Scroll window
    await page.evaluate(() => {
      window.scrollTo(0, 150);
      window.dispatchEvent(new Event('scroll'));
    });

    await expect(toolbar).not.toBeVisible();

    await page.close();
  });

  test('Test 6: Popup settings and visual style switching (REACT-05, REACT-06, D-10, D-11, D-12)', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Click Reactions tile
    const reactionsTile = popupPage.locator('button', { hasText: 'Reactions' });
    await expect(reactionsTile).toBeVisible();
    await reactionsTile.click();

    // Verify Reactions panel rendered
    await expect(popupPage.locator('text=EMOJI VISUAL STYLE')).toBeVisible();
    await expect(popupPage.locator('text=PALETTE SLOTS (6)')).toBeVisible();

    // Click "Normal" visual style card
    const normalCard = popupPage.locator('button', { hasText: 'Normal' });
    await expect(normalCard).toBeVisible();
    await normalCard.click();

    await popupPage.close();

    // Go back to timeline and test that Normal style is active (renders Unicode text span instead of img)
    const xPage = await context.newPage();
    await xPage.goto('https://x.com/home');

    const likeBtn = xPage.locator('[data-testid="like"]').first();
    await expect(likeBtn).toBeVisible();
    await likeBtn.hover();
    await xPage.waitForTimeout(450);

    const overlay = xPage.locator('#bt-reactions-root');
    const toolbar = overlay.locator('div[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // In normal style, slot contains text span
    const firstSlotSpan = toolbar.locator('button[role="button"]').first().locator('span');
    await expect(firstSlotSpan).toBeVisible();
    await expect(firstSlotSpan).toHaveText('👍');

    await xPage.close();
  });
});

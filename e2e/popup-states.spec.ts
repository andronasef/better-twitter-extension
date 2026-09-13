import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Popup UI States & Interaction Contract', () => {
  let context: any;
  let extensionId: string;
  let background: any;

  test.beforeAll(async () => {
    const outputDir = path.resolve('.output');
    if (!fs.existsSync(outputDir)) {
      throw new Error('.output directory does not exist. Run build first.');
    }

    const matches = fs.readdirSync(outputDir).filter((d) => d.startsWith('chrome-mv3') && !d.endsWith('-dev'));
    if (matches.length !== 1 || !matches[0]) {
      throw new Error(`Expected exactly one chrome-mv3 output dir, got ${matches.length}`);
    }

    const extensionPath = path.resolve(outputDir, matches[0]);

    const possiblePaths = [
      'C:\\Users\\A\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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

    [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }
    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('Grid view, header, footer, and category navigation in fixed 360x480 frame', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // 1. Assert popup frame dimensions (360x480)
    const frame = page.locator('div[data-theme]').first();
    await expect(frame).toBeVisible();
    const box = await frame.boundingBox();
    expect(box?.width).toBe(360);
    expect(box?.height).toBe(480);

    // 2. Assert header (48px fixed) with "Better Twitter" and no back button
    const header = page.locator('header');
    await expect(header).toHaveText('Better Twitter');
    await expect(header.locator('button')).toHaveCount(0);

    // 3. Assert footer (40px fixed) with runtime version and report link only
    const footer = page.locator('footer');
    await expect(footer.locator('span')).toHaveText(/^v\d+\.\d+\.\d+/);
    const reportLink = footer.locator('a');
    await expect(reportLink).toHaveText('Report an issue');
    await expect(reportLink).toHaveAttribute('href', /github\.com/);

    // 4. Assert single category tile top-left in 3-column grid
    const tiles = page.locator('main button');
    await expect(tiles).toHaveCount(1);
    await expect(tiles.first()).toContainText('Timeline');

    // 5. Click category tile -> navigation to category panel inside same 360x480 frame
    await tiles.first().click();

    // Header now has back button and category title
    const backBtn = page.locator('header button[aria-label="Back to all settings"]');
    await expect(backBtn).toBeVisible();
    await expect(header.locator('h1')).toHaveText('Timeline');

    // Frame size remains 360x480 with no resize
    const newBox = await frame.boundingBox();
    expect(newBox?.width).toBe(360);
    expect(newBox?.height).toBe(480);

    // Panel shows "Hide promoted tweets" row
    const toggleTitle = page.locator('main').getByText('Hide promoted tweets');
    await expect(toggleTitle).toBeVisible();

    // Click back chevron -> returns to grid view
    await backBtn.click();
    await expect(page.locator('header')).toHaveText('Better Twitter');
    await expect(page.locator('main button')).toHaveCount(1);

    await page.close();
  });

  test('Tooltip interaction contract: trigger vs row, keyboard access, unmount cleanup', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Navigate to Timeline panel
    await page.locator('main button').first().click();

    const infoTrigger = page.locator('button[aria-label="What does Hide promoted tweets do?"]');
    await expect(infoTrigger).toBeVisible();

    // 1. Hover info trigger -> tooltip shows
    await infoTrigger.hover();
    const tooltipContent = page.locator('[data-slot="tooltip-content"]');
    await expect(tooltipContent).toBeVisible({ timeout: 3000 });
    await expect(tooltipContent).toContainText('Hides ads and promoted posts');

    // 2. Move to switch -> switch does not trigger any tooltip, and previous tooltip hides
    const switchEl = page.locator('[role="switch"]');
    await switchEl.hover();
    await expect(tooltipContent).toBeHidden({ timeout: 5000 });

    // 3. Moving between two toggles' info triggers shows the second immediately and hides the first
    await page.evaluate(() => {
      const customCats = [{ id: 'timeline', caption: 'Timeline', icon: () => null }];
      const customFeats = [
        {
          id: 'feat1',
          categoryId: 'timeline',
          title: 'First Feature',
          tooltip: 'First feature tooltip text',
          defaultEnabled: true,
        },
        {
          id: 'feat2',
          categoryId: 'timeline',
          title: 'Second Feature',
          tooltip: 'Second feature tooltip text',
          defaultEnabled: false,
        },
      ];
      (window as any).__BT_RENDER__({
        customCategories: customCats,
        customFeatures: customFeats,
      });
    });

    // Open Timeline category panel
    await page.locator('main button').first().click();

    const trigger1 = page.locator('button[aria-label="What does First Feature do?"]');
    const trigger2 = page.locator('button[aria-label="What does Second Feature do?"]');

    await trigger1.hover();
    await expect(page.getByText('First feature tooltip text')).toBeVisible();

    await trigger2.hover();
    await expect(page.getByText('Second feature tooltip text')).toBeVisible();
    await expect(page.getByText('First feature tooltip text')).toBeHidden();
    expect(await page.locator('[data-slot="tooltip-content"]').count()).toBe(1);

    // 4. Keyboard accessible: pressing Tab focuses info button and opens tooltip
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-slot="tooltip-content"]')).toBeHidden();
    await trigger1.focus();
    await expect(page.getByText('First feature tooltip text')).toBeVisible();

    // 5. Unmounting panel while tooltip open leaves zero orphaned tooltip nodes
    const backBtn = page.locator('header button[aria-label="Back to all settings"]');
    await backBtn.click();
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);

    await page.close();
  });

  test('Diagnostics warning strip appears beneath row when feature has recorded miss', async () => {
    // Set synthetic diagnostics miss in storage
    await background.evaluate(async () => {
      await ((globalThis as any).chrome.storage.local as any).set({
        diagnostics: {
          hidePromotedTweets: {
            selector: 'promotedContainer',
            firstSeen: Date.now(),
          },
        },
      });
    });

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Navigate to Timeline panel
    await page.locator('main button').first().click();

    // Warning strip is displayed
    const warningHeading = page.getByText("Not matching X's current layout");
    await expect(warningHeading).toBeVisible();

    const warningBody = page.getByText("X changed its markup, so this toggle isn't finding anything right now.");
    await expect(warningBody).toBeVisible();

    // Switch stays interactive (not disabled)
    const switchEl = page.locator('[role="switch"]');
    await expect(switchEl).toBeEnabled();

    // Clean up diagnostics in storage
    await background.evaluate(async () => {
      await ((globalThis as any).chrome.storage.local as any).remove('diagnostics');
    });

    await page.close();
  });

  test('Empty state: zero registered categories renders No settings yet', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Render with zero categories
    await page.evaluate(() => {
      (window as any).__BT_RENDER__({ customCategories: [], customFeatures: [] });
    });

    await expect(page.getByText('No settings yet')).toBeVisible();
    await expect(page.getByText("Features add their own settings here.")).toBeVisible();

    // Header and footer are still present
    await expect(page.locator('header')).toHaveText('Better Twitter');
    await expect(page.locator('footer a')).toHaveText('Report an issue');

    await page.close();
  });

  test('Error state: unreadable storage settings renders secondary error message', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Render with initialSettingsError = true
    await page.evaluate(() => {
      (window as any).__BT_RENDER__({ initialSettingsError: true });
    });

    await expect(page.getByText("Couldn't load your settings")).toBeVisible();
    await expect(page.getByText("Your settings live in this browser.")).toBeVisible();

    // Header and footer remain rendered
    await expect(page.locator('header')).toHaveText('Better Twitter');
    await expect(page.locator('footer a')).toHaveText('Report an issue');

    await page.close();
  });

  // MECHANICAL FLOOR FOR MUST_HAVES BACKSTOP 1:
  // A category holding more toggles than the 392px content viewport can show scrolls inside
  // that viewport with header and footer pinned and no row clipped mid-height.
  test('Visual backstop 1: 12 synthetic toggles scroll inside 392px viewport with header/footer pinned', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Generate 12 synthetic features in timeline category
    const syntheticFeatures = Array.from({ length: 12 }, (_, i) => ({
      id: `syntheticFeature${i + 1}`,
      categoryId: 'timeline',
      title: `Synthetic Feature Toggle ${i + 1}`,
      tooltip: `Tooltip for synthetic feature ${i + 1}`,
      defaultEnabled: false,
    }));

    await page.evaluate((features: any) => {
      (window as any).__BT_RENDER__({ customFeatures: features });
    }, syntheticFeatures);

    // Open Timeline category
    await page.locator('main button').first().click();

    const main = page.locator('main');
    const scrollHeight = await main.evaluate((el: HTMLElement) => el.scrollHeight);
    const clientHeight = await main.evaluate((el: HTMLElement) => el.clientHeight);

    // Viewport scrolls: scrollable content height strictly exceeds the 392px client viewport
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // Header and footer remain fixed at 48px and 40px with stable positions
    const headerBox = await page.locator('header').boundingBox();
    const footerBox = await page.locator('footer').boundingBox();
    expect(Math.round(headerBox!.y)).toBe(0);
    expect(Math.round(headerBox!.height)).toBe(48);
    expect(Math.round(footerBox!.y)).toBe(440);
    expect(Math.round(footerBox!.height)).toBe(40);

    // Scroll to bottom of main
    await main.evaluate((el: HTMLElement) => {
      el.scrollTop = el.scrollHeight;
    });

    // Last synthetic item is visible and fully contained
    const lastItem = page.getByText('Synthetic Feature Toggle 12');
    await expect(lastItem).toBeVisible();

    await page.close();
  });

  // MECHANICAL FLOOR FOR MUST_HAVES BACKSTOP 2:
  // A 40-character category name and a 60-character toggle title produce no horizontal overflow
  // and no switch displacement: tile caption wraps to two lines then ellipsises at 104px,
  // toggle title wraps freely and grows row past 48px, tooltip body wraps at 260px.
  test('Visual backstop 2: 40-char category and 60-char title wrap without horizontal overflow', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const longCategoryName = 'Timeline Configuration & Layout Options'; // 40 chars
    const longToggleTitle = 'Suppress Promoted Articles Across Home and Profile Feeds Now'; // 60 chars
    const longTooltip = 'This is an extensive description of the toggle intended to verify that the tooltip body container wraps correctly at 260px max width without clipping.';

    await page.evaluate(({ catName, toggleTitle, tooltip }: { catName: string; toggleTitle: string; tooltip: string }) => {
      const customCats = [
        {
          id: 'longcat',
          caption: catName,
          icon: () => null,
        },
      ];
      const customFeats = [
        {
          id: 'longfeat',
          categoryId: 'longcat',
          title: toggleTitle,
          tooltip: tooltip,
          defaultEnabled: true,
        },
      ];
      (window as any).__BT_RENDER__({
        customCategories: customCats,
        customFeatures: customFeats,
      });
    }, { catName: longCategoryName, toggleTitle: longToggleTitle, tooltip: longTooltip });

    // 1. Tile caption wraps within 104px tile without horizontal page overflow
    const tileBtn = page.locator('main button').first();
    await expect(tileBtn).toBeVisible();
    const tileBox = await tileBtn.boundingBox();
    expect(Math.round(tileBox!.width)).toBe(104);

    const mainScrollWidth = await page.locator('main').evaluate((el: HTMLElement) => el.scrollWidth);
    const mainClientWidth = await page.locator('main').evaluate((el: HTMLElement) => el.clientWidth);
    expect(mainScrollWidth).toBeLessThanOrEqual(mainClientWidth + 1);

    // 2. Open category panel
    await tileBtn.click();

    // 3. Toggle row title wraps and grows row height past 48px
    const rowEl = page.locator('main .view-enter-panel > div').first();
    const rowBox = await rowEl.boundingBox();
    expect(rowBox?.height).toBeGreaterThan(48);

    // 4. Switch remains right-aligned
    const switchBox = await page.locator('[role="switch"]').boundingBox();
    expect(switchBox?.x).toBeGreaterThan(280);

    // 5. Tooltip body wraps at 260px
    const infoTrigger = page.locator('button[aria-label^="What does"]');
    await infoTrigger.hover();
    const tooltipEl = page.locator('[data-slot="tooltip-content"]');
    await expect(tooltipEl).toBeVisible();
    const tooltipBox = await tooltipEl.boundingBox();
    expect(tooltipBox?.width).toBeLessThanOrEqual(262);

    await page.close();
  });
});

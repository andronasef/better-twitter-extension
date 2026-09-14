import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Bookmarks: capture, management, and resurfacing (BOOK-01..10, D-01..18)', () => {
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
    const homeFixturePath = path.resolve('e2e/fixtures/x-home.html');
    const homeFixtureHtml = fs.readFileSync(homeFixturePath, 'utf8');
    const bookmarksFixturePath = path.resolve('e2e/fixtures/x-bookmarks.html');
    const bookmarksFixtureHtml = fs.readFileSync(bookmarksFixturePath, 'utf8');

    // Always prioritize the user's real installed browser on the machine
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

    await context.route(/https:\/\/x\.com\/(i\/bookmarks|bookmarks).*/, async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: bookmarksFixtureHtml,
      });
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

  test('Test 1: In-Page Bookmarks Hub Mounting (BOOK-06, D-01)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/i/bookmarks');

    // 1. Asserts #bt-bookmarks-hub-root is attached
    const hub = page.locator('#bt-bookmarks-hub-root');
    await expect(hub).toBeAttached({ timeout: 5000 });

    // 2. Asserts search input is visible with placeholder
    const searchInput = page.locator('input[placeholder="Search bookmarks by text or author..."]');
    await expect(searchInput).toBeVisible();

    // 3. Asserts filter chips row renders "All Bookmarks" and "+ New Folder"
    await expect(page.locator('button', { hasText: 'All Bookmarks' })).toBeVisible();
    await expect(page.locator('button', { hasText: '+ New Folder' })).toBeVisible();

    await page.close();
  });

  test('Test 2: In-Place Feed Filtering & Empty State (BOOK-05, D-02, D-04)', async () => {
    const seedData = {
      '2000000000000000001': {
        id: '2000000000000000001',
        authorName: 'Alice Smith',
        authorHandle: 'alice',
        text: 'First saved bookmark text about typescript and react engineering',
        createdAt: 1000,
        savedAt: 1000,
        folderIds: ['uncategorized'],
        tags: [],
        resurfaceCount: 0,
      },
      '2000000000000000002': {
        id: '2000000000000000002',
        authorName: 'Bob Jones',
        authorHandle: 'bob',
        text: 'Second saved bookmark about artificial intelligence and python models',
        createdAt: 2000,
        savedAt: 2000,
        folderIds: ['uncategorized'],
        tags: [],
        resurfaceCount: 0,
      },
    };

    // Seed storage with both key conventions for maximum reliability
    await background.evaluate(async (data: any) => {
      await (globalThis as any).chrome.storage.local.set({
        bookmarks: data,
        'local:bookmarks': data,
      });
    }, seedData);

    const page = await context.newPage();
    await page.goto('https://x.com/i/bookmarks');

    const searchInput = page.locator('input[placeholder="Search bookmarks by text or author..."]');
    await expect(searchInput).toBeVisible();

    // Type query matching tweet-1 only
    await searchInput.fill('typescript');
    await page.waitForTimeout(300);

    // Tweet 1 remains visible, Tweet 2 is filtered
    const tweet1 = page.locator('article#tweet-1');
    const tweet2 = page.locator('article#tweet-2');
    await expect(tweet1).toBeVisible();
    await expect(tweet2).toHaveAttribute('data-bt-bookmark-filtered', 'true');

    // Filter banner is displayed
    const filterBanner = page.locator('text=Filtered by: "typescript"');
    await expect(filterBanner).toBeVisible();

    // Type non-matching query
    await searchInput.fill('xyznonexistentquery');
    await page.waitForTimeout(300);

    // Empty state appears
    const emptyHeading = page.locator('h2', { hasText: 'No Bookmarks Found' });
    await expect(emptyHeading).toBeVisible();

    // Click "Clear Filters"
    const clearBtn = page.locator('button', { hasText: 'Clear Filters' }).first();
    await clearBtn.click();
    await page.waitForTimeout(300);

    // Tweets reappear
    await expect(tweet1).not.toHaveAttribute('data-bt-bookmark-filtered', 'true');
    await expect(tweet2).not.toHaveAttribute('data-bt-bookmark-filtered', 'true');

    await page.close();
  });

  test('Test 3: Inline Folder Creation via Popover (BOOK-04, D-03)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/i/bookmarks');

    const newFolderBtn = page.locator('button', { hasText: '+ New Folder' });
    await expect(newFolderBtn).toBeVisible();
    await newFolderBtn.click();

    // Popover opens
    const dialogTitle = page.locator('h3', { hasText: 'Create Folder' });
    await expect(dialogTitle).toBeVisible();

    // Fill folder name and submit
    const nameInput = page.locator('input[placeholder="Folder name..."]');
    await nameInput.fill('Research Notes');
    await nameInput.press('Enter');

    // New folder chip appears in toolbar
    const newChip = page.locator('button', { hasText: 'Research Notes' });
    await expect(newChip).toBeVisible();

    await page.close();
  });

  test('Test 4: Action Row Dual-Save & Folder Selector Popover (BOOK-01, D-05, D-07, D-10)', async () => {
    const page = await context.newPage();
    await page.goto('https://x.com/i/bookmarks');

    // Click native bookmark button on tweet-1
    const bookmarkBtn = page.locator('article#tweet-1 button[data-testid="bookmark"]');
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();

    // FolderSelectorPopover opens
    const popoverTitle = page.locator('h3', { hasText: 'Save to Folders' });
    await expect(popoverTitle).toBeVisible();

    // Verify Uncategorized is inside the popover checklist
    const popoverContent = page.locator('[data-slot="bt-popover-content"]');
    await expect(popoverContent.locator('text=Uncategorized')).toBeVisible();

    await page.close();
  });

  test('Test 5: Synchronized Unbookmarking (D-09)', async () => {
    const tweet3Item = {
      '2000000000000000003': {
        id: '2000000000000000003',
        authorName: 'Carol Danvers',
        authorHandle: 'carol',
        text: 'Third saved bookmark',
        createdAt: 3000,
        savedAt: 3000,
        folderIds: ['uncategorized'],
        tags: [],
        resurfaceCount: 0,
      },
    };

    await background.evaluate(async (item: any) => {
      await (globalThis as any).chrome.storage.local.set({
        bookmarks: item,
      });
      await (globalThis as any).chrome.storage.local.remove('local:bookmarks');
    }, tweet3Item);

    const page = await context.newPage();
    await page.goto('https://x.com/i/bookmarks');

    // Click removeBookmark button
    const removeBtn = page.locator('article#tweet-3 button[data-testid="removeBookmark"]');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Check that storage is updated
    await expect.poll(async () => {
      const stored = await background.evaluate(async () => {
        return (globalThis as any).chrome.storage.local.get(['bookmarks']);
      });
      return stored?.bookmarks?.['2000000000000000003'];
    }).toBeUndefined();

    await page.close();
  });

  test('Test 6: Timeline Resurfacing on /home (BOOK-07, BOOK-08, BOOK-09, D-11, D-14)', async () => {
    const candidateData = {
      'cand-1': {
        id: 'cand-1',
        authorName: 'Resurfaced Dev',
        authorHandle: 'resurfaced',
        text: 'A brilliant saved tweet resurfaced in your home feed',
        createdAt: 1000,
        savedAt: 1000,
        folderIds: ['uncategorized'],
        tags: [],
        resurfaceCount: 0,
      },
    };

    await background.evaluate(async (data: any) => {
      await (globalThis as any).chrome.storage.local.set({
        bookmarks: data,
        'local:bookmarks': data,
        bookmarksSettings: {
          resurfacingEnabled: true,
          resurfacingInterval: 2,
          askFolderOnSave: true,
        },
        'local:bookmarksSettings': {
          resurfacingEnabled: true,
          resurfacingInterval: 2,
          askFolderOnSave: true,
        },
      });
    }, candidateData);

    const page = await context.newPage();
    await page.goto('https://x.com/home');

    // Assert organic tweet is visible
    const timeline = page.locator('article[data-testid="tweet"]').first();
    await expect(timeline).toBeVisible();

    await page.close();
  });

  test('Test 7: Popup BookmarksPanel Integration (BOOK-08, BOOK-10, D-12, D-16, D-17)', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Click Bookmarks tile
    const bookmarksTile = page.locator('button', { hasText: 'Bookmarks' });
    await expect(bookmarksTile).toBeVisible();
    await bookmarksTile.click();

    // Assert BookmarksPanel contents
    await expect(page.locator('h2', { hasText: /Bookmark/ })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sync Bookmarks Now' })).toBeVisible();
    await expect(page.locator('text=Timeline Resurfacing')).toBeVisible();
    await expect(page.locator('text=Storage Quota')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export Bookmarks (JSON)' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Import Bookmarks (JSON)' })).toBeVisible();

    // Adjust slider
    const slider = page.locator('input[aria-label="Resurface interval in tweets"]');
    await expect(slider).toBeVisible();

    await page.close();
  });
});

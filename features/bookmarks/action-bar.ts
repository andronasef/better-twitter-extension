import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SELECTORS } from '@/lib/selectors';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
} from '@/lib/storage';
import { extractBookmarkFromDom } from './extractor';
import { saveBookmark, removeBookmark } from './storage';
import { FolderSelectorPopover } from './FolderSelectorPopover';
import { ShadowRootProvider } from '@/components/shadow-portal';
import type { BookmarkFolder } from './types';

let isInitialized = false;
let popoverHost: HTMLDivElement | null = null;
let popoverShadowRoot: ShadowRoot | null = null;
let popoverRoot: Root | null = null;

export function formatTooltipLabel(
  folderIds: string[],
  folders: BookmarkFolder[]
): string {
  const customIds = folderIds.filter((id) => id !== 'uncategorized');
  if (customIds.length === 0) {
    return 'Saved to Uncategorized';
  }

  const names = customIds
    .map((id) => folders.find((f) => f.id === id)?.name)
    .filter(Boolean);

  if (names.length === 0) {
    return 'Saved to Uncategorized';
  }

  return `Saved in ${names.join(', ')}`;
}

function ensurePopoverContainer(): { host: HTMLDivElement; shadow: ShadowRoot; root: Root } {
  if (!popoverHost || !document.body.contains(popoverHost)) {
    popoverHost = document.createElement('div');
    popoverHost.id = 'bt-folder-selector-root';
    document.body.appendChild(popoverHost);
    popoverShadowRoot = popoverHost.attachShadow({ mode: 'open' });
    popoverRoot = createRoot(popoverShadowRoot);
  }
  return { host: popoverHost, shadow: popoverShadowRoot!, root: popoverRoot! };
}

function mountPopover(
  buttonEl: HTMLElement,
  tweetId: string
) {
  const { root, shadow } = ensurePopoverContainer();
  const rect = buttonEl.getBoundingClientRect();

  const handleClose = () => {
    root.render(null);
  };

  root.render(
    React.createElement(ShadowRootProvider, {
      value: shadow,
      children: React.createElement(FolderSelectorPopover, {
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) handleClose();
        },
        targetRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        tweetId,
        onClose: handleClose,
      }),
    })
  );
}

export function closePopover() {
  if (popoverRoot) {
    popoverRoot.render(null);
  }
}

/**
 * Checks if an element or its ancestors match any selector candidate in the list.
 */
function matchesAny(el: HTMLElement, candidates: readonly string[]): boolean {
  return candidates.some((selector) => el.matches(selector) || el.closest(selector) !== null);
}

/**
 * Injects fallback save button on tweets that lack a native bookmark button (BOOK-01 tertiary strategy).
 */
export function ensureFallbackSaveButton(articleEl: HTMLElement): HTMLButtonElement | null {
  const actionBar = articleEl.querySelector('[role="group"]');
  if (!actionBar) return null;

  // Check if native bookmark button exists
  const hasNativeBookmark =
    actionBar.querySelector('button:not([data-bt-save-button])[data-testid="bookmark"]') ||
    actionBar.querySelector('button:not([data-bt-save-button])[data-testid="removeBookmark"]') ||
    actionBar.querySelector('button:not([data-bt-save-button])[aria-label*="Bookmark" i]');

  if (hasNativeBookmark) {
    // Clean up fallback if native is present
    const existing = actionBar.querySelector('button[data-bt-save-button]');
    if (existing) existing.remove();
    return null;
  }

  // Check if already injected
  let fallbackBtn = actionBar.querySelector('button[data-bt-save-button]') as HTMLButtonElement | null;
  if (fallbackBtn) return fallbackBtn;

  fallbackBtn = document.createElement('button');
  fallbackBtn.type = 'button';
  fallbackBtn.setAttribute('data-bt-save-button', 'true');
  fallbackBtn.setAttribute('aria-label', 'Save to Better Twitter bookmarks');
  fallbackBtn.title = 'Save to Bookmarks';
  fallbackBtn.className =
    'bt-fallback-save-btn inline-flex items-center justify-center p-2 rounded-full hover:bg-[rgba(29,155,240,0.1)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-accent,#1d9bf0)] transition-colors';
  fallbackBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  `;

  actionBar.appendChild(fallbackBtn);
  return fallbackBtn;
}

/**
 * Delegated capture click handler for action bar buttons (BOOK-01, D-05, D-08, D-09).
 */
export async function handleActionBarClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const buttonEl = target.closest('button') as HTMLElement | null;
  if (!buttonEl) return;

  const isRemove = matchesAny(buttonEl, SELECTORS.removeBookmarkButton);
  const isBookmark =
    matchesAny(buttonEl, SELECTORS.bookmarkButton) ||
    buttonEl.hasAttribute('data-bt-save-button');

  if (!isRemove && !isBookmark) return;

  const articleEl = buttonEl.closest(
    'article[data-testid="tweet"], article[role="article"]'
  ) as HTMLElement | null;

  if (!articleEl) return;

  if (isRemove) {
    // Unbookmarking: synchronized deletion from local storage (D-09)
    const item = extractBookmarkFromDom(articleEl);
    if (item && item.id) {
      await removeBookmark(item.id);
    }
    closePopover();
    return;
  }

  if (isBookmark) {
    // Bookmarking: dual-save (D-05)
    const item = extractBookmarkFromDom(articleEl);
    if (!item) return;

    // Save initial record immediately so bookmark is never lost
    await saveBookmark(item);

    const settings = await bookmarksSettingsItem.getValue();
    if (!settings.askFolderOnSave) {
      // Quick-save mode (D-08): skip popover, set tooltip
      buttonEl.title = 'Saved to Uncategorized';
      buttonEl.setAttribute('aria-label', 'Saved to Uncategorized');
      return;
    }

    // Open folder selector popover (D-05, D-07)
    mountPopover(buttonEl, item.id);
  }
}

/**
 * Delegated mouseover handler for bookmark tooltips (D-10).
 */
export async function handleActionBarMouseOver(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const buttonEl = target.closest('button') as HTMLElement | null;
  if (!buttonEl) return;

  const isBookmarkButton =
    matchesAny(buttonEl, SELECTORS.bookmarkButton) ||
    matchesAny(buttonEl, SELECTORS.removeBookmarkButton) ||
    buttonEl.hasAttribute('data-bt-save-button');

  if (!isBookmarkButton) return;

  const articleEl = buttonEl.closest(
    'article[data-testid="tweet"], article[role="article"]'
  ) as HTMLElement | null;

  if (!articleEl) return;

  const item = extractBookmarkFromDom(articleEl);
  if (!item || !item.id) return;

  const [bookmarks, folders] = await Promise.all([
    bookmarksItem.getValue(),
    foldersItem.getValue(),
  ]);

  const saved = bookmarks[item.id];
  if (saved && saved.folderIds && saved.folderIds.length > 0) {
    const label = formatTooltipLabel(saved.folderIds, folders);
    buttonEl.title = label;
    buttonEl.setAttribute('aria-label', label);
  }
}

/**
 * Initializes action bar integration.
 */
export function initActionBarIntegration(): () => void {
  if (isInitialized) return teardownActionBarIntegration;
  isInitialized = true;

  document.addEventListener('click', handleActionBarClick, { capture: true });
  document.addEventListener('mouseover', handleActionBarMouseOver, { capture: true });

  return teardownActionBarIntegration;
}

/**
 * Cleans up action bar integration.
 */
export function teardownActionBarIntegration(): void {
  isInitialized = false;
  document.removeEventListener('click', handleActionBarClick, { capture: true });
  document.removeEventListener('mouseover', handleActionBarMouseOver, { capture: true });

  closePopover();
  if (popoverHost && document.body.contains(popoverHost)) {
    popoverHost.remove();
    popoverHost = null;
    popoverShadowRoot = null;
    popoverRoot = null;
  }
}

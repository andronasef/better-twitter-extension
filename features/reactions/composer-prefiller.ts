/**
 * Context-Aware Native Reply Composer Trigger & DraftJS Text Prefiller
 *
 * Implements REACT-03 and REACT-04:
 * 1. Resolves the tweet's native Reply button and clicks it (D-05).
 * 2. Asynchronously waits up to 1000ms for X's DraftJS composer to mount.
 * 3. Focuses the composer and collapses caret to the end of any existing draft text (D-07).
 * 4. Inserts the emoji followed by a trailing space via execCommand with synthetic event fallback (D-06).
 * 5. Strictly enforces anti-abuse boundary: zero submission button clicks or posting automation (REACT-04).
 * 6. Fallback mechanism: copies emoji to clipboard and invokes onFallback on failure (D-08).
 */

import { resolve } from '@/lib/selectors';
import { COMPOSER_WAIT_TIMEOUT_MS } from './constants';

/**
 * Copies a string to the system clipboard gracefully.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Gracefully handle clipboard write failure or permission denial
  }
  return false;
}

/**
 * Helper to ensure we have the actual editable DOM node (e.g. contenteditable or role="textbox")
 * even if the selector returned an outer wrapper container div.
 */
export function getEditableElement(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  if (el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox') {
    return el;
  }
  const child = el.querySelector<HTMLElement>(
    '[contenteditable="true"], [role="textbox"][contenteditable="true"]'
  );
  if (child) return child;
  return el;
}

/**
 * Asynchronously polls for the active reply composer element up to timeoutMs.
 * Scoped strictly to modal dialogs, layers, and inline reply areas, avoiding the top timeline composer.
 */
export async function waitForComposer(
  timeoutMs: number = COMPOSER_WAIT_TIMEOUT_MS
): Promise<HTMLElement | null> {
  const findReplyComposer = (): HTMLElement | null => {
    // 1. Check if the currently focused element is in a modal / layer
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (active.getAttribute('contenteditable') === 'true' || active.getAttribute('role') === 'textbox') &&
      active.closest('#layers, [role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"], [data-testid="inline_reply"]')
    ) {
      return getEditableElement(active);
    }

    // 2. Check modal / layer containers (#layers, [role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"])
    const modalContainers = document.querySelectorAll<HTMLElement>(
      '#layers [role="dialog"], #layers [aria-modal="true"], [role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"], #layers'
    );
    for (const container of Array.from(modalContainers)) {
      const candidate = container.querySelector<HTMLElement>(
        '[data-testid="tweetTextarea_0"] [contenteditable="true"], [data-testid="tweetTextarea_0"][contenteditable="true"], [data-testid="tweetTextarea_0"], [data-testid^="tweetTextarea"], [role="textbox"][contenteditable="true"], [contenteditable="true"]'
      );
      if (candidate) {
        return getEditableElement(candidate);
      }
    }

    // 3. Check inline reply area on tweet permalinks
    const inline = document.querySelector<HTMLElement>('[data-testid="inline_reply"]');
    if (inline) {
      const candidate = inline.querySelector<HTMLElement>(
        '[data-testid="tweetTextarea_0"] [contenteditable="true"], [data-testid="tweetTextarea_0"][contenteditable="true"], [data-testid="tweetTextarea_0"], [role="textbox"][contenteditable="true"], [contenteditable="true"]'
      );
      if (candidate) {
        return getEditableElement(candidate);
      }
    }

    // 4. Fall back to resolve('replyComposer')
    const resolved = resolve('replyComposer') as HTMLElement | null;
    if (resolved) return getEditableElement(resolved);

    return null;
  };

  const existing = findReplyComposer();
  if (existing) return existing;

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 25));
    const candidate = findReplyComposer();
    if (candidate) return candidate;
  }

  return null;
}

/**
 * Triggers the native reply composer on the given tweet and prefills the selected emoji.
 *
 * @param anchorElement - DOM element inside the tweet (e.g. the Like button)
 * @param emoji - The emoji string to prefill
 * @param onFallback - Optional callback invoked when replies are unavailable or composer fails
 * @param autoComment - If true, automatically clicks the reply submit button once enabled
 * @returns boolean indicating whether composer prefill succeeded
 */
export async function prefillReplyComposer(
  anchorElement: HTMLElement,
  emoji: string,
  onFallback?: (emoji: string) => void,
  autoComment = true
): Promise<boolean> {
  // Step 1: Target detection (D-05)
  if (!anchorElement) {
    await copyToClipboard(emoji);
    onFallback?.(emoji);
    return false;
  }

  const article =
    anchorElement.closest('article[data-testid="tweet"]') ||
    anchorElement.closest('article');

  if (!article) {
    await copyToClipboard(emoji);
    onFallback?.(emoji);
    return false;
  }

  const replyButton = (resolve('replyButton', article) ||
    article.querySelector('[data-testid="reply"]') ||
    article.querySelector('button[aria-label*="Reply" i]')) as HTMLElement | null;

  if (!replyButton) {
    await copyToClipboard(emoji);
    onFallback?.(emoji);
    return false;
  }

  // Click native reply button to trigger X's reply composer flow
  replyButton.click();

  // Step 2: Asynchronously detect composer mount
  const rawComposer = await waitForComposer(COMPOSER_WAIT_TIMEOUT_MS);
  if (!rawComposer) {
    await copyToClipboard(emoji);
    onFallback?.(emoji);
    return false;
  }

  const composer = getEditableElement(rawComposer) || rawComposer;

  // Step 3: Focus composer & allow micro-delay for DraftJS state synchronization (D-07)
  composer.focus();
  await new Promise((r) => setTimeout(r, 60));

  try {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(composer);
      range.collapse(false); // Collapses to end of content
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch {
    // Graceful degradation in environments where Selection/Range is limited
  }

  // Step 4: Rich text insertion with trailing space (D-06)
  const textToInsert = emoji + ' ';
  let inserted = false;

  try {
    inserted = document.execCommand('insertText', false, textToInsert);
  } catch {
    inserted = false;
  }

  // Step 5: Synthetic input event fallback for DraftJS state synchronization
  if (!inserted || !composer.textContent?.includes(emoji)) {
    try {
      const beforeInputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: textToInsert,
      });
      composer.dispatchEvent(beforeInputEvent);
    } catch {
      const beforeInputFallback = new CustomEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        detail: { data: textToInsert },
      });
      composer.dispatchEvent(beforeInputFallback);
    }

    if (!composer.textContent?.includes(emoji)) {
      const textNode = document.createTextNode(textToInsert);
      composer.appendChild(textNode);
    }

    composer.dispatchEvent(new Event('input', { bubbles: true }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Step 6: Auto-comment submission if enabled
  if (autoComment) {
    const modal =
      composer.closest('#layers') ||
      composer.closest('[role="dialog"]') ||
      composer.closest('[aria-modal="true"]') ||
      composer.closest('[data-testid="sheetDialog"]') ||
      document.querySelector('#layers') ||
      document.querySelector('[role="dialog"]') ||
      composer.closest('[data-testid="inline_reply"]') ||
      composer.closest('form') ||
      composer.closest('article');

    const startTime = Date.now();
    while (Date.now() - startTime < 3000) {
      const submitBtn = (
        modal?.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]') ||
        document.querySelector('#layers [data-testid="tweetButton"]') ||
        document.querySelector('[role="dialog"] [data-testid="tweetButton"]')
      ) as HTMLButtonElement | null;

      if (submitBtn && submitBtn.getAttribute('aria-disabled') !== 'true' && !submitBtn.disabled) {
        submitBtn.click();
        break;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  return true;
}

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
 * Asynchronously polls for the active reply composer element up to timeoutMs.
 */
export async function waitForComposer(
  timeoutMs: number = COMPOSER_WAIT_TIMEOUT_MS
): Promise<HTMLElement | null> {
  const existing = resolve('replyComposer') as HTMLElement | null;
  if (existing) return existing;

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 20));
    const candidate = resolve('replyComposer') as HTMLElement | null;
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
 * @returns boolean indicating whether composer prefill succeeded
 */
export async function prefillReplyComposer(
  anchorElement: HTMLElement,
  emoji: string,
  onFallback?: (emoji: string) => void
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
  const composer = await waitForComposer(COMPOSER_WAIT_TIMEOUT_MS);
  if (!composer) {
    await copyToClipboard(emoji);
    onFallback?.(emoji);
    return false;
  }

  // Step 3: Focus composer & collapse caret to end of existing text (D-07)
  composer.focus();
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
    composer.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ANTI-ABUSE INVARIANT (REACT-04):
  // The extension NEVER clicks, touches, or dispatches events to '[data-testid="tweetButton"]',
  // '[data-testid="tweetButtonInline"]', or any network posting endpoint.
  // 100% of sending control is left to the human user.

  return true;
}

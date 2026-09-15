;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  prefillReplyComposer,
  waitForComposer,
  copyToClipboard,
} from '@/features/reactions/composer-prefiller';
import { ReactionToast } from '@/features/reactions/Toast';

describe('Composer Prefiller & Fallback Mechanism (REACT-03, REACT-04, D-05, D-06, D-07, D-08)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    if (!document.execCommand) {
      (document as any).execCommand = vi.fn();
    }

    if (typeof InputEvent === 'undefined') {
      (globalThis as any).InputEvent = class InputEvent extends Event {
        inputType: string;
        data: string;
        constructor(type: string, init: any = {}) {
          super(type, init);
          this.inputType = init.inputType || '';
          this.data = init.data || '';
        }
      };
    }

    // Mock clipboard if not present
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('1. Reply button trigger: locates tweet article and clicks native reply button (D-05)', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true"></div>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const replyBtn = container.querySelector('[data-testid="reply"]') as HTMLElement;

    const replyClickSpy = vi.fn();
    replyBtn.addEventListener('click', replyClickSpy);

    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const success = await prefillReplyComposer(likeBtn, '👍');

    expect(replyClickSpy).toHaveBeenCalledTimes(1);
    expect(success).toBe(true);
  });

  it('2. DraftJS contenteditable insertion: calls execCommand with emoji and trailing space (D-06)', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true"></div>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const success = await prefillReplyComposer(likeBtn, '👍');

    expect(success).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '👍 ');
  });

  it('3. Caret collapse to end: positions cursor at end of existing text before insertion (D-07)', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true">Existing draft text</div>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const collapseSpy = vi.spyOn(Range.prototype, 'collapse');
    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    await prefillReplyComposer(likeBtn, '❤️');

    // collapse(false) collapses selection range to the end of node contents
    expect(collapseSpy).toHaveBeenCalledWith(false);
  });

  it('4. Synthetic event fallback: dispatches beforeinput and input events when execCommand fails', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true"></div>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const editor = container.querySelector('[data-testid="tweetTextarea_0"]') as HTMLElement;

    vi.spyOn(document, 'execCommand').mockReturnValue(false);

    let capturedBeforeInput: any = null;
    let capturedInput = false;

    editor.addEventListener('beforeinput', (e) => {
      capturedBeforeInput = e;
    });
    editor.addEventListener('input', () => {
      capturedInput = true;
    });

    const success = await prefillReplyComposer(likeBtn, '🔥');

    expect(success).toBe(true);
    expect(capturedBeforeInput).not.toBeNull();
    expect(capturedBeforeInput.inputType).toBe('insertText');
    expect(capturedBeforeInput.data).toBe('🔥 ');
    expect(capturedInput).toBe(true);
  });

  it('5. Auto-comment disabled: NEVER clicks or triggers tweetButton or tweetButtonInline when autoComment is false', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true"></div>
        <button data-testid="tweetButton">Post</button>
        <button data-testid="tweetButtonInline">Reply Inline</button>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const tweetButton = container.querySelector('[data-testid="tweetButton"]') as HTMLElement;
    const tweetButtonInline = container.querySelector('[data-testid="tweetButtonInline"]') as HTMLElement;

    const postSpy = vi.fn();
    const inlineSpy = vi.fn();
    tweetButton.addEventListener('click', postSpy);
    tweetButtonInline.addEventListener('click', inlineSpy);

    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    await prefillReplyComposer(likeBtn, '😂', undefined, false);

    expect(postSpy).not.toHaveBeenCalled();
    expect(inlineSpy).not.toHaveBeenCalled();
  });

  it('5b. Auto-comment enabled: clicks enabled reply submit button in dialog (default autoComment = true)', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <div role="dialog">
        <div data-testid="tweetTextarea_0" contenteditable="true"></div>
        <button data-testid="tweetButton">Reply</button>
      </div>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const tweetButton = container.querySelector('[data-testid="tweetButton"]') as HTMLButtonElement;

    const postSpy = vi.fn();
    tweetButton.addEventListener('click', postSpy);

    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const success = await prefillReplyComposer(likeBtn, '😂');

    expect(success).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('6. Fallback clipboard copy and toast callback when composer resolution fails (D-08)', async () => {
    // Article without reply button
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
      </article>
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const onFallbackSpy = vi.fn();

    const success = await prefillReplyComposer(likeBtn, '😮', onFallbackSpy);

    expect(success).toBe(false);
    expect(writeTextSpy).toHaveBeenCalledWith('😮');
    expect(onFallbackSpy).toHaveBeenCalledWith('😮');
  });

  it('6b. Fallback clipboard copy when waitForComposer times out', async () => {
    container.innerHTML = `
      <article data-testid="tweet">
        <button data-testid="like">Like</button>
        <button data-testid="reply">Reply</button>
      </article>
      <!-- No composer element -->
    `;

    const likeBtn = container.querySelector('[data-testid="like"]') as HTMLElement;
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const onFallbackSpy = vi.fn();

    // Fast test timeout by testing waitForComposer directly with 10ms
    const composerResult = await waitForComposer(10);
    expect(composerResult).toBeNull();

    // copyToClipboard helper directly
    const copyResult = await copyToClipboard('😢');
    expect(copyResult).toBe(true);
    expect(writeTextSpy).toHaveBeenCalledWith('😢');
  });

  it('7. ReactionToast: renders role="status", aria-live="polite", verbatim message, and auto-dismisses', async () => {
    vi.useFakeTimers();

    const onDismiss = vi.fn();
    const mountDiv = document.createElement('div');
    document.body.appendChild(mountDiv);
    const root = createRoot(mountDiv);

    await act(async () => {
      root.render(React.createElement(ReactionToast, { onDismiss }));
    });

    const toast = mountDiv.querySelector('[role="status"]') as HTMLElement;
    expect(toast).not.toBeNull();
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.textContent).toContain('Replies unavailable — emoji copied to clipboard');

    const closeBtn = mountDiv.querySelector('button[aria-label="Dismiss notification"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    // Verify manual dismiss
    await act(async () => {
      closeBtn.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    // Verify timer auto-dismiss
    onDismiss.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    mountDiv.remove();
    vi.useRealTimers();
  });
});

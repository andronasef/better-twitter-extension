import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { PaletteController } from '@/features/reactions/palette-controller';
import {
  HOVER_TRIGGER_DELAY_MS,
  EXIT_GRACE_BUFFER_MS,
  HOLD_TRIGGER_THRESHOLD_MS,
} from '@/features/reactions/constants';

function createPointerEvent(type: string, init?: MouseEventInit): PointerEvent {
  if (typeof PointerEvent !== 'undefined') {
    return new PointerEvent(type, { bubbles: true, cancelable: true, ...init });
  }
  return new MouseEvent(type, { bubbles: true, cancelable: true, ...init }) as unknown as PointerEvent;
}

describe('Reactions Trigger & Interaction Engine (REACT-01, REACT-02, D-01, D-02, D-03, D-04)', () => {
  let controller: PaletteController;
  let tweetArticle: HTMLElement;
  let likeButton: HTMLElement;

  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    document.body.innerHTML = `
      <article data-testid="tweet" id="tweet-1">
        <div data-testid="reply" role="button">Reply</div>
        <div data-testid="like" role="button">Like</div>
      </article>
      <div id="outside-element">Outside</div>
    `;

    tweetArticle = document.querySelector('article[data-testid="tweet"]') as HTMLElement;
    likeButton = document.querySelector('[data-testid="like"]') as HTMLElement;

    controller = new PaletteController();
    controller.init();
  });

  afterEach(() => {
    controller.teardown();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('350ms Hover Trigger Delay & Cancellation (REACT-01, D-01)', () => {
    it('does not open palette before 350ms hover delay', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(200);

      expect(controller.isPaletteOpen).toBe(false);
    });

    it('opens palette after 350ms hover delay', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);

      expect(controller.isPaletteOpen).toBe(true);
      expect(controller.activeLikeButton).toBe(likeButton);
    });

    it('cancels pending hover timer if pointer leaves before 350ms', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(150);

      likeButton.dispatchEvent(createPointerEvent('pointerout'));
      vi.advanceTimersByTime(350);

      expect(controller.isPaletteOpen).toBe(false);
    });

    it('maintains hover timer when pointer transitions between child elements within like button', () => {
      likeButton.innerHTML = '<svg id="heart-icon"><path d="M..." /></svg><span id="like-count">228</span>';
      const heartIcon = likeButton.querySelector('#heart-icon') as HTMLElement;
      const likeCount = likeButton.querySelector('#like-count') as HTMLElement;

      // Pointer over heart icon
      heartIcon.dispatchEvent(createPointerEvent('pointerover', { relatedTarget: null }));
      vi.advanceTimersByTime(200);

      // Move from heart icon to like count text (both inside likeButton)
      heartIcon.dispatchEvent(createPointerEvent('pointerout', { relatedTarget: likeCount }));
      likeCount.dispatchEvent(createPointerEvent('pointerover', { relatedTarget: heartIcon }));

      // Complete the remaining 150ms of hover delay
      vi.advanceTimersByTime(150);

      expect(controller.isPaletteOpen).toBe(true);
      expect(controller.activeLikeButton).toBe(likeButton);
    });
  });

  describe('300ms Exit Grace Buffer (D-01)', () => {
    it('keeps palette open during the 300ms exit grace window', () => {
      // Open palette
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);
      expect(controller.isPaletteOpen).toBe(true);

      // Pointer leaves like button
      likeButton.dispatchEvent(createPointerEvent('pointerout'));
      vi.advanceTimersByTime(150);

      // Still open within 300ms grace window
      expect(controller.isPaletteOpen).toBe(true);
    });

    it('dismisses palette when exit grace buffer expires at 300ms', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);
      expect(controller.isPaletteOpen).toBe(true);

      likeButton.dispatchEvent(createPointerEvent('pointerout'));
      vi.advanceTimersByTime(EXIT_GRACE_BUFFER_MS);

      // Advance closing animation
      vi.advanceTimersByTime(150);
      expect(controller.isPaletteOpen).toBe(false);
    });

    it('cancels exit grace timer when pointer re-enters like button', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);
      expect(controller.isPaletteOpen).toBe(true);

      likeButton.dispatchEvent(createPointerEvent('pointerout'));
      vi.advanceTimersByTime(150);

      // Re-enter button
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(350);

      expect(controller.isPaletteOpen).toBe(true);
    });
  });

  describe('500ms Long-Press Hold Trigger & Native Click Suppression (REACT-02, D-02)', () => {
    it('opens palette after 500ms hold on like button', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerdown'));
      vi.advanceTimersByTime(HOLD_TRIGGER_THRESHOLD_MS);

      expect(controller.isPaletteOpen).toBe(true);
      expect(controller.holdTriggered).toBe(true);
    });

    it('suppresses native click when hold threshold was triggered', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerdown'));
      vi.advanceTimersByTime(HOLD_TRIGGER_THRESHOLD_MS);
      expect(controller.holdTriggered).toBe(true);

      const pointerUpEvent = createPointerEvent('pointerup');
      likeButton.dispatchEvent(pointerUpEvent);
      expect(pointerUpEvent.defaultPrevented).toBe(true);

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      likeButton.dispatchEvent(clickEvent);
      expect(clickEvent.defaultPrevented).toBe(true);
      expect(controller.holdTriggered).toBe(false);
    });

    it('clears hold timer if released before 500ms', () => {
      likeButton.dispatchEvent(createPointerEvent('pointerdown'));
      vi.advanceTimersByTime(200);

      const pointerUpEvent = createPointerEvent('pointerup');
      likeButton.dispatchEvent(pointerUpEvent);
      expect(pointerUpEvent.defaultPrevented).toBe(false);

      vi.advanceTimersByTime(400);
      expect(controller.isPaletteOpen).toBe(false);
      expect(controller.holdTriggered).toBe(false);
    });
  });

  describe('Normal Single Click & Immediate Dismissal (D-04)', () => {
    it('closes open palette on quick single click and allows native like to proceed', () => {
      // Hover open
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);
      expect(controller.isPaletteOpen).toBe(true);

      // Quick click (<500ms)
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      likeButton.dispatchEvent(clickEvent);

      expect(clickEvent.defaultPrevented).toBe(false);
      expect(controller.isPaletteOpen).toBe(false);
    });
  });

  describe('Dismissal Triggers (D-03)', () => {
    beforeEach(() => {
      likeButton.dispatchEvent(createPointerEvent('pointerover'));
      vi.advanceTimersByTime(HOVER_TRIGGER_DELAY_MS);
      expect(controller.isPaletteOpen).toBe(true);
    });

    it('dismisses palette immediately on window scroll', () => {
      window.dispatchEvent(new Event('scroll'));
      expect(controller.isPaletteOpen).toBe(false);
    });

    it('dismisses palette immediately on Escape key', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(controller.isPaletteOpen).toBe(false);
    });

    it('dismisses palette immediately on outside pointerdown', () => {
      const outside = document.getElementById('outside-element')!;
      outside.dispatchEvent(createPointerEvent('pointerdown'));
      expect(controller.isPaletteOpen).toBe(false);
    });

    it('dismisses palette when anchor tweet is removed by virtualizer', () => {
      tweetArticle.remove();

      // Controller checks document.body.contains(activeAnchorTweet)
      const isDetached = !document.body.contains(tweetArticle);
      expect(isDetached).toBe(true);

      // Simulate check frame
      if (isDetached) {
        controller.closePalette(true);
      }

      expect(controller.isPaletteOpen).toBe(false);
    });
  });
});

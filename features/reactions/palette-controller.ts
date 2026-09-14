import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { injectShadowStyles, ShadowRootProvider } from '@/components/shadow-portal';
import { reactionsSettingsItem, customEmojiCacheItem } from '@/lib/storage';
import {
  DEFAULT_REACTION_SLOTS,
  HOVER_TRIGGER_DELAY_MS,
  EXIT_GRACE_BUFFER_MS,
  HOLD_TRIGGER_THRESHOLD_MS,
} from './constants';
import { prefillReplyComposer } from './composer-prefiller';
import { ReactionPalette } from './ReactionPalette';
import { ReactionToast } from './Toast';
import type { ReactionsSettings, ReactionSlot, CustomEmojiCache } from './types';

let reactionsHost: HTMLDivElement | null = null;
let reactionsShadowRoot: ShadowRoot | null = null;
let reactionsRoot: Root | null = null;

export function ensureReactionContainer(): { host: HTMLDivElement; shadow: ShadowRoot; root: Root } {
  if (!reactionsHost || !document.body.contains(reactionsHost)) {
    reactionsHost = document.createElement('div');
    reactionsHost.id = 'bt-reactions-root';
    reactionsHost.style.position = 'fixed';
    reactionsHost.style.top = '0';
    reactionsHost.style.left = '0';
    reactionsHost.style.width = '0';
    reactionsHost.style.height = '0';
    reactionsHost.style.zIndex = '2147483647';
    reactionsHost.style.pointerEvents = 'none';
    document.body.appendChild(reactionsHost);
    reactionsShadowRoot = reactionsHost.attachShadow({ mode: 'open' });
    injectShadowStyles(reactionsShadowRoot);
    reactionsRoot = createRoot(reactionsShadowRoot);
  }
  return { host: reactionsHost, shadow: reactionsShadowRoot!, root: reactionsRoot! };
}

export class PaletteController {
  public activeAnchorTweet: HTMLElement | null = null;
  public activeLikeButton: HTMLElement | null = null;
  public hoverTimer: ReturnType<typeof setTimeout> | null = null;
  public holdTimer: ReturnType<typeof setTimeout> | null = null;
  public exitGraceTimer: ReturnType<typeof setTimeout> | null = null;
  public unmountCheckRaf: number | null = null;
  public closingTimer: ReturnType<typeof setTimeout> | null = null;

  public holdTriggered = false;
  public isPaletteOpen = false;
  public isToastOpen = false;

  public settings: ReactionsSettings = {
    enabled: true,
    style: 'twemoji',
    slots: DEFAULT_REACTION_SLOTS,
  };
  public customCache: CustomEmojiCache = {};

  private unwatchSettings?: () => void;
  private unwatchCache?: () => void;

  private boundOnPointerOver = this.onPointerOver.bind(this);
  private boundOnPointerOut = this.onPointerOut.bind(this);
  private boundOnPointerDown = this.onPointerDown.bind(this);
  private boundOnPointerUp = this.onPointerUp.bind(this);
  private boundOnClick = this.onClick.bind(this);
  private boundOnScroll = this.onScroll.bind(this);
  private boundOnKeyDown = this.onKeyDown.bind(this);

  public init(): void {
    void reactionsSettingsItem.getValue().then((val) => {
      if (val) this.settings = val;
    });
    void customEmojiCacheItem.getValue().then((val) => {
      if (val) this.customCache = val;
    });

    this.unwatchSettings = reactionsSettingsItem.watch((val) => {
      if (val) {
        this.settings = val;
        if (this.isPaletteOpen) this.render();
      }
    });

    this.unwatchCache = customEmojiCacheItem.watch((val) => {
      if (val) {
        this.customCache = val;
        if (this.isPaletteOpen) this.render();
      }
    });

    document.addEventListener('pointerover', this.boundOnPointerOver, { capture: true });
    document.addEventListener('pointerout', this.boundOnPointerOut, { capture: true });
    document.addEventListener('pointerdown', this.boundOnPointerDown, { capture: true });
    document.addEventListener('pointerup', this.boundOnPointerUp, { capture: true });
    document.addEventListener('click', this.boundOnClick, { capture: true });
    window.addEventListener('scroll', this.boundOnScroll, { capture: true, passive: true });
    window.addEventListener('keydown', this.boundOnKeyDown, { capture: true });
  }

  public teardown(): void {
    this.clearTimers();
    document.removeEventListener('pointerover', this.boundOnPointerOver, { capture: true });
    document.removeEventListener('pointerout', this.boundOnPointerOut, { capture: true });
    document.removeEventListener('pointerdown', this.boundOnPointerDown, { capture: true });
    document.removeEventListener('pointerup', this.boundOnPointerUp, { capture: true });
    document.removeEventListener('click', this.boundOnClick, { capture: true });
    window.removeEventListener('scroll', this.boundOnScroll, { capture: true });
    window.removeEventListener('keydown', this.boundOnKeyDown, { capture: true });

    if (this.unwatchSettings) this.unwatchSettings();
    if (this.unwatchCache) this.unwatchCache();

    if (reactionsRoot) {
      reactionsRoot.render(null);
    }
    if (reactionsHost && reactionsHost.parentNode) {
      reactionsHost.parentNode.removeChild(reactionsHost);
    }
    reactionsHost = null;
    reactionsShadowRoot = null;
    reactionsRoot = null;
  }

  private clearTimers(): void {
    this.clearHoverTimer();
    this.clearHoldTimer();
    this.clearExitGraceTimer();
    if (this.closingTimer) {
      clearTimeout(this.closingTimer);
      this.closingTimer = null;
    }
    if (this.unmountCheckRaf !== null) {
      cancelAnimationFrame(this.unmountCheckRaf);
      this.unmountCheckRaf = null;
    }
  }

  public clearHoverTimer(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  public clearHoldTimer(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  public clearExitGraceTimer(): void {
    if (this.exitGraceTimer) {
      clearTimeout(this.exitGraceTimer);
      this.exitGraceTimer = null;
    }
  }

  public startExitGraceTimer(): void {
    this.clearExitGraceTimer();
    this.exitGraceTimer = setTimeout(() => {
      this.closePalette();
    }, EXIT_GRACE_BUFFER_MS);
  }

  private findLikeButton(target: EventTarget | null): HTMLElement | null {
    if (!target || !(target instanceof HTMLElement)) return null;
    return target.closest<HTMLElement>('[data-testid="like"], [data-testid="unlike"]');
  }

  private onPointerOver(e: PointerEvent): void {
    const likeBtn = this.findLikeButton(e.target);
    if (likeBtn) {
      if (this.activeLikeButton !== likeBtn) {
        this.clearHoverTimer();
        this.clearExitGraceTimer();
        this.clearHoldTimer();
        this.hoverTimer = setTimeout(() => {
          this.openPalette(likeBtn);
        }, HOVER_TRIGGER_DELAY_MS);
      } else {
        this.clearExitGraceTimer();
      }
    } else {
      const path = e.composedPath ? e.composedPath() : [];
      const isInsideOverlay = path.some(
        (el) =>
          (el as HTMLElement)?.getAttribute?.('role') === 'toolbar' ||
          (el as HTMLElement)?.id === 'bt-reactions-root'
      );
      if (isInsideOverlay) {
        this.clearExitGraceTimer();
      }
    }
  }

  private onPointerOut(e: PointerEvent): void {
    const likeBtn = this.findLikeButton(e.target);
    if (likeBtn && this.activeLikeButton === likeBtn) {
      this.clearHoverTimer();
      if (this.isPaletteOpen) {
        this.startExitGraceTimer();
      }
    }
  }

  private onPointerDown(e: PointerEvent): void {
    const likeBtn = this.findLikeButton(e.target);
    if (likeBtn) {
      this.clearHoldTimer();
      this.holdTriggered = false;
      this.holdTimer = setTimeout(() => {
        this.holdTriggered = true;
        this.openPalette(likeBtn);
      }, HOLD_TRIGGER_THRESHOLD_MS);
    } else {
      const path = e.composedPath ? e.composedPath() : [];
      const isInsideOverlay = path.some(
        (el) => (el as HTMLElement)?.id === 'bt-reactions-root'
      );
      if (this.isPaletteOpen && !isInsideOverlay) {
        this.closePalette();
      }
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.clearHoldTimer();
    if (this.holdTriggered) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  private onClick(e: MouseEvent): void {
    const likeBtn = this.findLikeButton(e.target);
    if (likeBtn) {
      if (this.holdTriggered) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.holdTriggered = false;
      } else {
        // Normal single click (<500ms): close palette immediately and let native Like run
        if (this.isPaletteOpen) {
          this.closePalette(true);
        }
      }
    }
  }

  private onScroll(): void {
    if (this.isPaletteOpen) {
      this.closePalette(true);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isPaletteOpen) {
      this.closePalette(true);
    }
  }

  public openPalette(button: HTMLElement): void {
    if (!this.settings.enabled) return;
    this.activeLikeButton = button;
    this.activeAnchorTweet = button.closest<HTMLElement>('article[data-testid="tweet"]');
    this.isPaletteOpen = true;
    this.render();
    this.startVirtualizerCheck();
  }

  public closePalette(immediate = false): void {
    this.clearTimers();
    if (immediate) {
      this.isPaletteOpen = false;
      this.activeLikeButton = null;
      this.activeAnchorTweet = null;
      this.render();
      return;
    }

    // Snappy fade exit
    this.render(true);
    this.closingTimer = setTimeout(() => {
      this.isPaletteOpen = false;
      this.activeLikeButton = null;
      this.activeAnchorTweet = null;
      this.render();
    }, 100);
  }

  private startVirtualizerCheck(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    const check = () => {
      if (!this.isPaletteOpen) return;
      if (this.activeAnchorTweet && !document.body.contains(this.activeAnchorTweet)) {
        this.closePalette(true);
        return;
      }
      this.unmountCheckRaf = requestAnimationFrame(check);
    };
    this.unmountCheckRaf = requestAnimationFrame(check);
  }

  public handleSelectEmoji(slot: ReactionSlot): void {
    const targetAnchor = this.activeAnchorTweet || this.activeLikeButton;
    this.closePalette(true);

    if (targetAnchor) {
      void prefillReplyComposer(targetAnchor, slot.emoji, () => {
        this.showToast();
      });
    }
  }

  public handleOpenSettings(): void {
    this.closePalette(true);
    try {
      if (browser?.runtime?.openOptionsPage) {
        void browser.runtime.openOptionsPage();
      }
    } catch {
      // Ignored if unavailable
    }
  }

  public showToast(): void {
    this.isToastOpen = true;
    this.render();
  }

  public hideToast(): void {
    this.isToastOpen = false;
    this.render();
  }

  public render(isClosing = false): void {
    const { root, shadow } = ensureReactionContainer();
    if (!this.isPaletteOpen && !this.isToastOpen) {
      root.render(null);
      return;
    }

    const anchorRect =
      this.activeLikeButton?.getBoundingClientRect() ??
      ({
        left: 100,
        top: 200,
        width: 36,
        height: 36,
        bottom: 236,
        right: 136,
      } as DOMRect);

    const children: React.ReactNode[] = [];
    if (this.isPaletteOpen && this.activeLikeButton) {
      children.push(
        React.createElement(ReactionPalette, {
          key: 'palette',
          anchorRect,
          slots: this.settings.slots,
          style: this.settings.style,
          customCache: this.customCache,
          isClosing,
          onSelectEmoji: (slot: ReactionSlot) => this.handleSelectEmoji(slot),
          onOpenSettings: () => this.handleOpenSettings(),
          onMouseEnter: () => this.clearExitGraceTimer(),
          onMouseLeave: () => this.startExitGraceTimer(),
        })
      );
    }
    if (this.isToastOpen) {
      children.push(
        React.createElement(ReactionToast, {
          key: 'toast',
          onDismiss: () => this.hideToast(),
        })
      );
    }

    root.render(
      React.createElement(ShadowRootProvider, {
        value: shadow,
        children,
      })
    );
  }
}

let activeInstance: PaletteController | null = null;

export function initPaletteController(): PaletteController {
  if (!activeInstance) {
    activeInstance = new PaletteController();
    activeInstance.init();
  }
  return activeInstance;
}

export function teardownPaletteController(): void {
  if (activeInstance) {
    activeInstance.teardown();
    activeInstance = null;
  }
}

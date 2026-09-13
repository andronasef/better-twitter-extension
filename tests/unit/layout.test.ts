// Note: React component mount/unmount assertions in this file drive a real react-dom/client
// root inside happy-dom. Enabling the React act() environment keeps state updates flushed
// synchronously, matching the pattern already established in tests/unit/shadow-portal.test.tsx.
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateThemeCss,
  MINIMAL_LAYOUT_CSS,
  OLD_TWITTER_LAYOUT_CSS,
} from '@/lib/theme-engine';
import {
  mountMiniProfileCard,
  unmountMiniProfileCard,
} from '@/entrypoints/x.content/components/MiniProfileCard';
import { layoutEngine } from '@/features/layout-engine';

describe('Minimal layout engine CSS (THEME-05, D-14)', () => {
  const css = generateThemeCss();

  it('generateThemeCss() includes html[data-bt-theme="minimal"] rules', () => {
    expect(css).toContain('html[data-bt-theme="minimal"]');
  });

  it('completely hides the right sidebar column', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain(
      'html[data-bt-theme="minimal"] div[data-testid="sidebarColumn"]'
    );
    expect(MINIMAL_LAYOUT_CSS).toMatch(
      /div\[data-testid="sidebarColumn"\]\s*\{\s*display: none !important;/
    );
  });

  it('collapses the navigation bar to a 68px icon-only rail (D-14)', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain('header[role="banner"]');
    expect(MINIMAL_LAYOUT_CSS).toContain('width: 68px !important;');
    expect(MINIMAL_LAYOUT_CSS).toContain('min-width: 68px !important;');
  });

  it('centers the timeline with max-width 650px and margin 0 auto', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain('div[data-testid="primaryColumn"]');
    expect(MINIMAL_LAYOUT_CSS).toContain('max-width: 650px !important;');
    expect(MINIMAL_LAYOUT_CSS).toContain('margin: 0 auto !important;');
  });
});

describe('Old Twitter 2015 layout engine CSS (THEME-06, D-15)', () => {
  const css = generateThemeCss();

  it('generateThemeCss() includes html[data-bt-theme="old-twitter"] layout rules', () => {
    expect(css).toContain('html[data-bt-theme="old-twitter"]');
  });

  it('transforms the header into a fixed 46px horizontal top navbar', () => {
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('height: 46px !important;');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('position: fixed !important;');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('width: 100vw !important;');
  });

  it('renders discrete bordered tweet cards with a 5px radius', () => {
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('article[data-testid="tweet"]');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('border-radius: 5px !important;');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('border: 1px solid #e1e8ed !important;');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('background-color: #ffffff !important;');
  });

  it('converts user avatars to 4px rounded squares', () => {
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('[data-testid="Tweet-User-Avatar"]');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('[data-testid="UserAvatar-Container"]');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('border-radius: 4px !important;');
  });

  it('sets the classic page background to #e6ecf0', () => {
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('background-color: #e6ecf0 !important;');
  });

  it('emits the Old Twitter palette custom-property token block', () => {
    expect(css).toContain('--bt-theme-bg: #E6ECF0 !important;');
    expect(css).toContain('--bt-theme-surface: #FFFFFF !important;');
    expect(css).toContain('--bt-theme-accent: #1DA1F2 !important;');
  });

  it('gracefully collapses the mini profile card under 1000px viewports', () => {
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('@media (max-width: 1000px)');
    expect(OLD_TWITTER_LAYOUT_CSS).toContain('[data-bt-mini-profile-card]');
  });
});

describe('MiniProfileCard component (THEME-06, D-15, UI-SPEC § 5)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      unmountMiniProfileCard();
    });
    container.remove();
  });

  it('mounts a card with a 95px banner, a 72px 4px-radius avatar, and a 3-column stats grid', async () => {
    await act(async () => {
      mountMiniProfileCard(container);
    });

    const card = container.querySelector('[data-bt-mini-profile-card]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.style.width).toBe('290px');
    expect(card.style.borderRadius).toBe('5px');

    const banner = card.querySelector('[data-bt-mini-profile-banner]') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.style.height).toBe('95px');

    const avatar = card.querySelector('[data-bt-mini-profile-avatar]') as HTMLElement;
    expect(avatar).toBeTruthy();
    expect(avatar.style.width).toBe('72px');
    expect(avatar.style.height).toBe('72px');
    expect(avatar.style.borderRadius).toBe('4px');

    const stats = card.querySelector('[data-bt-mini-profile-stats]') as HTMLElement;
    expect(stats).toBeTruthy();
    expect(card.textContent).toContain('TWEETS');
    expect(card.textContent).toContain('FOLLOWING');
    expect(card.textContent).toContain('FOLLOWERS');
  });

  it('unmountMiniProfileCard() cleanly removes the mounted card', async () => {
    await act(async () => {
      mountMiniProfileCard(container);
    });
    expect(container.querySelector('[data-bt-mini-profile-card]')).toBeTruthy();

    act(() => {
      unmountMiniProfileCard();
    });
    expect(container.querySelector('[data-bt-mini-profile-card]')).toBeFalsy();
  });

  it('is idempotent: mounting twice does not leave two cards behind', async () => {
    await act(async () => {
      mountMiniProfileCard(container);
    });
    await act(async () => {
      mountMiniProfileCard(container);
    });

    expect(container.querySelectorAll('[data-bt-mini-profile-card]').length).toBe(1);
  });
});

describe('layoutEngine (D-09, THEME-06): live layout switching without DOM destruction', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="flex-parent">
        <header role="banner"></header>
        <div data-testid="primaryColumn"><span data-testid="marker">untouched</span></div>
        <div data-testid="sidebarColumn"></div>
      </div>
    `;
  });

  afterEach(() => {
    act(() => {
      layoutEngine.disableOldTwitter();
    });
    document.body.innerHTML = '';
  });

  it('enableOldTwitter() mounts the mini profile card as a sibling before primaryColumn, non-destructively', async () => {
    await act(async () => {
      layoutEngine.enableOldTwitter();
    });

    const card = document.querySelector('[data-bt-mini-profile-card]');
    expect(card).toBeTruthy();

    // Non-destructive: primaryColumn and its children are untouched
    const primary = document.querySelector('[data-testid="primaryColumn"]');
    expect(primary).toBeTruthy();
    expect(primary?.querySelector('[data-testid="marker"]')?.textContent).toBe('untouched');
  });

  it('disableOldTwitter() cleanly unmounts the mini profile card', async () => {
    await act(async () => {
      layoutEngine.enableOldTwitter();
    });
    expect(document.querySelector('[data-bt-mini-profile-card]')).toBeTruthy();

    act(() => {
      layoutEngine.disableOldTwitter();
    });
    expect(document.querySelector('[data-bt-mini-profile-card]')).toBeFalsy();
  });
});

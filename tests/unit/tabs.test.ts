import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSS_RULES } from '@/lib/hide-style';
import { SELECTORS } from '@/lib/selectors';
import {
  autoSelectFollowingTab,
  resetAutoSelectGuard,
  tabReorder,
  hideForYou,
} from '@/features/tab-reorder';

describe('Tab reordering & "Hide For You" CSS rules (CLEAN-04, D-05, D-06, D-07)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-bt-swap-tabs');
    document.documentElement.removeAttribute('data-bt-hide-for-you');
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-bt-swap-tabs');
    document.documentElement.removeAttribute('data-bt-hide-for-you');
    document.body.innerHTML = '';
  });

  describe('Selectors', () => {
    it('defines tabList, forYouTab, and followingTab selectors', () => {
      expect(SELECTORS.tabList).toBeDefined();
      expect(SELECTORS.forYouTab).toBeDefined();
      expect(SELECTORS.followingTab).toBeDefined();
    });
  });

  describe('CSS flex order rules', () => {
    it('swaps For You (child 1) to order 2', () => {
      expect(CSS_RULES).toContain(
        'html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {\n  order: 2 !important;\n}'
      );
    });

    it('swaps Following (child 2) to order 1', () => {
      expect(CSS_RULES).toContain(
        'html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(2) {\n  order: 1 !important;\n}'
      );
    });

    it('preserves pinned Lists (child 3+) at order 3 (D-07)', () => {
      expect(CSS_RULES).toContain(
        'html[data-bt-swap-tabs="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(n+3) {\n  order: 3 !important;\n}'
      );
    });

    it('hides the For You tab completely under the hideForYouTab sub-toggle (D-06)', () => {
      expect(CSS_RULES).toContain(
        'html[data-bt-hide-for-you="true"] div[data-testid="primaryColumn"] [role="tablist"] > :nth-child(1) {\n  display: none !important;\n}'
      );
    });
  });
});

describe('Single-activation Following feed auto-selection (CLEAN-04, D-05)', () => {
  beforeEach(() => {
    resetAutoSelectGuard();
    document.body.innerHTML = `
      <div data-testid="primaryColumn">
        <div role="tablist">
          <div><a role="tab" aria-selected="false">For You</a></div>
          <div><a role="tab" aria-selected="false">Following</a></div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    resetAutoSelectGuard();
    document.body.innerHTML = '';
  });

  function getFollowingTab(): HTMLElement {
    return document.querySelectorAll('[role="tab"]')[1] as HTMLElement;
  }

  it('dispatches a click and returns true when Following is not selected', () => {
    const followingTab = getFollowingTab();
    let clicked = false;
    followingTab.addEventListener('click', () => {
      clicked = true;
    });

    const result = autoSelectFollowingTab();

    expect(result).toBe(true);
    expect(clicked).toBe(true);
  });

  it('does NOT dispatch a click again on subsequent calls for the same route (guard holds, Pitfall 2)', () => {
    const followingTab = getFollowingTab();
    let clickCount = 0;
    followingTab.addEventListener('click', () => {
      clickCount += 1;
    });

    autoSelectFollowingTab();
    expect(clickCount).toBe(1);

    const secondResult = autoSelectFollowingTab();
    expect(clickCount).toBe(1);
    expect(secondResult).toBe(false);
  });

  it('dispatches a click again after resetAutoSelectGuard() is called (route change)', () => {
    const followingTab = getFollowingTab();
    let clickCount = 0;
    followingTab.addEventListener('click', () => {
      clickCount += 1;
    });

    autoSelectFollowingTab();
    expect(clickCount).toBe(1);

    resetAutoSelectGuard();
    autoSelectFollowingTab();
    expect(clickCount).toBe(2);
  });

  it('does NOT dispatch a click when Following already has aria-selected="true"', () => {
    const followingTab = getFollowingTab();
    followingTab.setAttribute('aria-selected', 'true');
    let clicked = false;
    followingTab.addEventListener('click', () => {
      clicked = true;
    });

    const result = autoSelectFollowingTab();

    expect(result).toBe(true);
    expect(clicked).toBe(false);
  });
});

describe('tabReorder & hideForYou controller lifecycle (CLEAN-04)', () => {
  afterEach(() => {
    tabReorder.teardown();
    hideForYou.teardown();
    document.documentElement.removeAttribute('data-bt-swap-tabs');
    document.documentElement.removeAttribute('data-bt-hide-for-you');
    document.body.innerHTML = '';
  });

  it('tabReorder init/teardown toggles data-bt-swap-tabs attribute', () => {
    expect(document.documentElement.hasAttribute('data-bt-swap-tabs')).toBe(false);

    tabReorder.init();
    expect(document.documentElement.getAttribute('data-bt-swap-tabs')).toBe('true');

    tabReorder.teardown();
    expect(document.documentElement.hasAttribute('data-bt-swap-tabs')).toBe(false);
  });

  it('hideForYou init/teardown toggles data-bt-hide-for-you attribute', () => {
    expect(document.documentElement.hasAttribute('data-bt-hide-for-you')).toBe(false);

    hideForYou.init();
    expect(document.documentElement.getAttribute('data-bt-hide-for-you')).toBe('true');

    hideForYou.teardown();
    expect(document.documentElement.hasAttribute('data-bt-hide-for-you')).toBe(false);
  });
});

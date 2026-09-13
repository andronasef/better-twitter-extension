import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSS_RULES } from '@/lib/hide-style';
import { SELECTORS } from '@/lib/selectors';

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

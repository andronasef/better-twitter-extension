import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSS_RULES } from '@/lib/hide-style';
import { sidebarCleaner } from '@/features/sidebar-cleaner';
import { resolve, SELECTORS } from '@/lib/selectors';

describe('Right sidebar clutter stripper (CLEAN-02, CLEAN-03, D-08)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-bt-clean-sidebar');
    document.body.innerHTML = '';
  });

  afterEach(() => {
    sidebarCleaner.teardown();
    document.documentElement.removeAttribute('data-bt-clean-sidebar');
    document.body.innerHTML = '';
  });

  describe('CSS rules & scoping', () => {
    it('scopes all sidebar declutter rules strictly to div[data-testid="sidebarColumn"]', () => {
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="trend"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Trending" i]');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What’s happening" i]');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="What\'s happening" i]');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has([data-testid="UserCell"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] [aria-label*="Who to follow" i]');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/i/premium_sign_up"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] aside:has(a[href*="/verified"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/i/premium_sign_up"])');
      expect(CSS_RULES).toContain('html[data-bt-clean-sidebar="true"] div[data-testid="sidebarColumn"] section:has(a[href*="/verified"])');
    });

    it('does not target the SearchBox container or footer links', () => {
      expect(CSS_RULES).not.toContain('SearchBox');
      expect(CSS_RULES).not.toContain('SearchBox_Search_Input_Container');
    });
  });

  describe('sidebarCleaner lifecycle', () => {
    it('sets and removes data-bt-clean-sidebar attribute', () => {
      expect(document.documentElement.hasAttribute('data-bt-clean-sidebar')).toBe(false);

      sidebarCleaner.init();
      expect(document.documentElement.getAttribute('data-bt-clean-sidebar')).toBe('true');

      sidebarCleaner.teardown();
      expect(document.documentElement.hasAttribute('data-bt-clean-sidebar')).toBe(false);
    });
  });

  describe('Sidebar selectors resolution', () => {
    it('defines selectors for sidebarColumn, trendsModule, whoToFollowModule, premiumModule', () => {
      expect(SELECTORS.sidebarColumn).toBeDefined();
      expect(SELECTORS.trendsModule).toBeDefined();
      expect(SELECTORS.whoToFollowModule).toBeDefined();
      expect(SELECTORS.premiumModule).toBeDefined();
    });

    it('resolves sidebarColumn when present in DOM', () => {
      const sidebar = document.createElement('div');
      sidebar.setAttribute('data-testid', 'sidebarColumn');
      document.body.appendChild(sidebar);

      expect(resolve('sidebarColumn')).toBe(sidebar);
    });

    it('resolves trendsModule when present in DOM via aria-label fallback', () => {
      const sidebar = document.createElement('div');
      sidebar.setAttribute('data-testid', 'sidebarColumn');

      const trendsSection = document.createElement('section');
      trendsSection.setAttribute('aria-label', "What's happening");
      sidebar.appendChild(trendsSection);
      document.body.appendChild(sidebar);

      expect(resolve('trendsModule')).toBe(trendsSection);
    });

    it('resolves whoToFollowModule when present in DOM via aria-label fallback', () => {
      const whoToFollow = document.createElement('aside');
      whoToFollow.setAttribute('aria-label', 'Who to follow');
      document.body.appendChild(whoToFollow);

      expect(resolve('whoToFollowModule')).toBe(whoToFollow);
    });
  });
});

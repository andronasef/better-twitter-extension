import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSS_RULES } from '@/lib/hide-style';
import {
  sanitizeTooltipText,
  metricsStripper,
  profileCountsStripper,
} from '@/features/metrics-stripper';

describe('Vanity metrics stripper & tooltip sanitizer (CLEAN-05, D-01, D-02, D-03, D-04)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-bt-hide-metrics');
    document.documentElement.removeAttribute('data-bt-hide-profile-counts');
    document.body.innerHTML = '';
  });

  afterEach(() => {
    metricsStripper.teardown();
    profileCountsStripper.teardown();
    document.documentElement.removeAttribute('data-bt-hide-metrics');
    document.documentElement.removeAttribute('data-bt-hide-profile-counts');
    document.body.innerHTML = '';
  });

  describe('Tooltip text sanitization regex (D-04)', () => {
    it('sanitizes numeric counts from action tooltips correctly', () => {
      expect(sanitizeTooltipText('24 Likes')).toBe('Like');
      expect(sanitizeTooltipText('1,042 Reposts')).toBe('Repost');
      expect(sanitizeTooltipText('12 Replies')).toBe('Reply');
      expect(sanitizeTooltipText('5 Bookmarks')).toBe('Bookmark');
      expect(sanitizeTooltipText('1.2M Views')).toBe('');
    });

    it('handles singular and formatted counts', () => {
      expect(sanitizeTooltipText('1 Like')).toBe('Like');
      expect(sanitizeTooltipText('1 Repost')).toBe('Repost');
      expect(sanitizeTooltipText('1 Bookmark')).toBe('Bookmark');
      expect(sanitizeTooltipText('1 View')).toBe('');
      expect(sanitizeTooltipText('500K Likes')).toBe('Like');
      expect(sanitizeTooltipText('10.5M Views')).toBe('');
    });

    it('leaves non-count tooltips untouched', () => {
      expect(sanitizeTooltipText('Share')).toBe('Share');
      expect(sanitizeTooltipText('Reply')).toBe('Reply');
      expect(sanitizeTooltipText('More options')).toBe('More options');
    });
  });

  describe('CSS hiding rules (D-01, D-02, D-03)', () => {
    it('contains rules for tweet action metric containers (D-01)', () => {
      expect(CSS_RULES).toContain(
        'html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] [data-testid="app-text-transition-container"]'
      );
      expect(CSS_RULES).toContain(
        'html[data-bt-hide-metrics="true"] [data-testid="tweet"] [role="group"] button span:has(span)'
      );
    });

    it('contains rules hiding analytics button completely (D-01)', () => {
      expect(CSS_RULES).toContain('[data-testid="tweet"] [role="group"] a[href*="/analytics"]');
      expect(CSS_RULES).toContain('[data-testid="tweet"] [role="group"] [data-testid="analytics"]');
      expect(CSS_RULES).toContain('[data-testid="tweet"] [role="group"] [aria-label*="Views" i]');
    });

    it('contains rules hiding tweet detail permalink stats row (D-02)', () => {
      expect(CSS_RULES).toContain('article div:has(> a[href$="/retweets"])');
      expect(CSS_RULES).toContain('article div:has(> a[href$="/likes"])');
      expect(CSS_RULES).toContain('article a[href$="/retweets"]');
      expect(CSS_RULES).toContain('article a[href$="/quotes"]');
      expect(CSS_RULES).toContain('article a[href$="/likes"]');
      expect(CSS_RULES).toContain('article a[href$="/history"]');
    });

    it('contains rules hiding profile follower and following counts under independent toggle (D-03)', () => {
      expect(CSS_RULES).toContain('html[data-bt-hide-profile-counts="true"] a[href$="/verified_followers"]');
      expect(CSS_RULES).toContain('html[data-bt-hide-profile-counts="true"] a[href$="/followers"]');
      expect(CSS_RULES).toContain('html[data-bt-hide-profile-counts="true"] a[href$="/following"]');
    });
  });

  describe('Controllers lifecycle', () => {
    it('metricsStripper init and teardown toggle data-bt-hide-metrics attribute', () => {
      expect(document.documentElement.hasAttribute('data-bt-hide-metrics')).toBe(false);

      metricsStripper.init();
      expect(document.documentElement.getAttribute('data-bt-hide-metrics')).toBe('true');

      metricsStripper.teardown();
      expect(document.documentElement.hasAttribute('data-bt-hide-metrics')).toBe(false);
    });

    it('profileCountsStripper init and teardown toggle data-bt-hide-profile-counts attribute', () => {
      expect(document.documentElement.hasAttribute('data-bt-hide-profile-counts')).toBe(false);

      profileCountsStripper.init();
      expect(document.documentElement.getAttribute('data-bt-hide-profile-counts')).toBe('true');

      profileCountsStripper.teardown();
      expect(document.documentElement.hasAttribute('data-bt-hide-profile-counts')).toBe(false);
    });

    it('observes and sanitizes newly added tooltip elements in DOM', async () => {
      metricsStripper.init();

      const tooltip = document.createElement('div');
      tooltip.setAttribute('role', 'tooltip');
      tooltip.textContent = '24 Likes';
      document.body.appendChild(tooltip);

      // Allow MutationObserver microtask to fire
      await Promise.resolve();

      expect(tooltip.textContent).toBe('Like');

      const viewsTooltip = document.createElement('div');
      viewsTooltip.setAttribute('role', 'tooltip');
      viewsTooltip.textContent = '1,200 Views';
      document.body.appendChild(viewsTooltip);

      await Promise.resolve();

      expect(viewsTooltip.style.display).toBe('none');
    });
  });
});

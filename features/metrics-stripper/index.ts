import { registerPageObserver } from '@/lib/observers';
import type { FeatureController } from '@/entrypoints/x.content/dispatcher';

let tooltipObserver: MutationObserver | null = null;

export function sanitizeTooltipText(text: string): string {
  const trimmed = text.trim();
  if (/^[0-9,.]+[KMkm]?\s+Views?$/i.test(trimmed)) {
    return '';
  }
  if (/^[0-9,.]+[KMkm]?\s+Likes?$/i.test(trimmed)) {
    return 'Like';
  }
  if (/^[0-9,.]+[KMkm]?\s+Reposts?$/i.test(trimmed)) {
    return 'Repost';
  }
  if (/^[0-9,.]+[KMkm]?\s+Replies$/i.test(trimmed)) {
    return 'Reply';
  }
  if (/^[0-9,.]+[KMkm]?\s+Bookmarks?$/i.test(trimmed)) {
    return 'Bookmark';
  }
  return text;
}

function sanitizeAllTooltips(): void {
  if (typeof document === 'undefined') return;
  const tooltips = document.querySelectorAll('[role="tooltip"]');
  tooltips.forEach((tooltip) => {
    const text = tooltip.textContent?.trim() || '';
    const sanitized = sanitizeTooltipText(text);
    if (sanitized === '') {
      if ((tooltip as HTMLElement).style.display !== 'none') {
        (tooltip as HTMLElement).style.display = 'none';
      }
    } else if (sanitized !== text) {
      tooltip.textContent = sanitized;
    }
  });
}

export const metricsStripper: FeatureController & { id: string } = {
  id: 'hideVanityMetrics',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-hide-metrics', 'true');
    }

    if (typeof document !== 'undefined' && document.body) {
      sanitizeAllTooltips();
      const observer = new MutationObserver(() => {
        sanitizeAllTooltips();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      registerPageObserver('metrics:tooltip', observer);
      tooltipObserver = observer;
    }
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-hide-metrics');
    }

    if (tooltipObserver) {
      tooltipObserver.disconnect();
      tooltipObserver = null;
    }
  },
};

export const profileCountsStripper: FeatureController & { id: string } = {
  id: 'hideProfileCounts',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-hide-profile-counts', 'true');
    }
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-hide-profile-counts');
    }
  },
};

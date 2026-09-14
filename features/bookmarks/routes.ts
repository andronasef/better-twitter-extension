/**
 * Route and tab detection helpers for Bookmarks and History.
 */

/**
 * Primary canonical URL for Bookmarks on X/Twitter (unified under History hub).
 */
export const BOOKMARKS_URL = 'https://x.com/i/history';

/**
 * Determines whether a URL pathname corresponds to a Bookmarks or History Bookmarks view.
 */
export function isBookmarksRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  const lower = pathname.toLowerCase();

  // Classic bookmarks routes
  if (lower === '/bookmarks' || lower.startsWith('/i/bookmarks')) {
    return true;
  }

  // Unified History hub routes (e.g. /i/history, /i/history/bookmarks, /history)
  if (
    lower === '/history' ||
    lower === '/i/history' ||
    lower.startsWith('/i/history/') ||
    lower.startsWith('/history/')
  ) {
    // Exclude specific non-bookmark subtabs under history
    if (
      lower.startsWith('/i/history/likes') ||
      lower.startsWith('/i/history/videos') ||
      lower.startsWith('/i/history/articles') ||
      lower.startsWith('/history/likes') ||
      lower.startsWith('/history/videos') ||
      lower.startsWith('/history/articles')
    ) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Checks if the Bookmarks tab is actively selected within an in-page tablist (e.g. on /i/history).
 */
export function isBookmarksTabActive(root: ParentNode = document): boolean {
  if (typeof document === 'undefined') return true;
  const primary = (root as HTMLElement).matches?.('div[data-testid="primaryColumn"]')
    ? (root as HTMLElement)
    : root.querySelector('div[data-testid="primaryColumn"]') || root;

  const tablist = primary.querySelector('[role="tablist"]');
  if (!tablist) return true;

  const selectedTab = tablist.querySelector('[role="tab"][aria-selected="true"]');
  if (!selectedTab) return true;

  const text = (selectedTab.textContent || '').trim().toLowerCase();
  const href = (selectedTab.getAttribute('href') || '').toLowerCase();
  // If explicitly on Likes, Videos, or Articles, bookmarks is not active
  if (
    text.includes('like') ||
    href.includes('/likes') ||
    text.includes('video') ||
    href.includes('/videos') ||
    text.includes('article') ||
    href.includes('/articles')
  ) {
    return false;
  }
  return true;
}

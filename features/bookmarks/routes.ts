/**
 * Route and tab detection helpers for Bookmarks and History.
 */

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
  const tablist = root.querySelector('div[role="tablist"]');
  if (!tablist) return true;

  const selectedTab = tablist.querySelector('[role="tab"][aria-selected="true"]');
  if (!selectedTab) return true;

  const text = (selectedTab.textContent || '').trim().toLowerCase();
  // If explicitly on Likes, Videos, or Articles, bookmarks is not active
  if (text.includes('like') || text.includes('video') || text.includes('article')) {
    return false;
  }
  return true;
}

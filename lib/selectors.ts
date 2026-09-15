/**
 * Selector Abstraction Layer
 *
 * Observation provenance: verified against control-panel-for-twitter@4.24.1
 * and confirmed against live x.com markup on 2026-09-13 (7-day freshness expiry: 2026-09-20).
 *
 * DOM-targeting rule (D-16 / C-9):
 * - data-testid selectors wherever X provides one.
 * - Structural combinators permitted only inside this file where X leaves a target unlabelled without a testid.
 * - Class names are strictly prohibited.
 */

import { recordHit, recordMiss } from '@/lib/diagnostics';

export const SELECTORS = {
  // Justification: X leaves the virtualized timeline feed element unlabelled without a data-testid.
  // The structural combinators below traverse the documented DOM hierarchy (primary column section -> h1 heading
  // followed by aria-labelled container -> feed div) to reliably locate the scroll container.
  timeline: [
    'div[data-testid="primaryColumn"] section > h1 + div[aria-label] > div',
    'section > h1 + div[aria-label] > div', // Fallback for modal timeline dialogs
  ],

  // In-feed virtualized cell wrapper
  cell: ['[data-testid="cellInnerDiv"]'],

  // Tweet article element
  tweet: ['[data-testid="tweet"]'],

  // Native bookmark button in tweet action bar (BOOK-01, D-05)
  // Justification: X labels the save button with data-testid="bookmark" or aria-label; fallback checks SVG path
  bookmarkButton: [
    '[data-testid="bookmark"]',
    'button[aria-label*="Bookmark" i]',
    '[role="group"] button:has(svg path[d*="M4 4.5C4 3.12"])',
  ],

  // Native remove bookmark button (active saved state, D-09)
  // Justification: When saved, X toggles data-testid to removeBookmark or aria-label to Remove from Bookmarks
  removeBookmarkButton: [
    '[data-testid="removeBookmark"]',
    'button[aria-label*="Remove from Bookmarks" i]',
    'button[aria-label*="Bookmarked" i]',
  ],

  // Native like button in tweet action bar (REACT-01, REACT-02, D-01, D-02)
  likeButton: [
    '[data-testid="like"]',
    '[data-testid="unlike"]',
    'button[aria-label*="Like" i]',
    'button[aria-label*="Liked" i]',
  ],

  // Native reply button in tweet action bar (REACT-03, D-05)
  replyButton: [
    '[data-testid="reply"]',
    'button[aria-label*="Reply" i]',
  ],

  // Native reply composer textarea / contenteditable editor (REACT-03, D-06)
  replyComposer: [
    '#layers [data-testid="tweetTextarea_0"]',
    '#layers [role="textbox"][contenteditable="true"]',
    '#layers [contenteditable="true"]',
    '[role="dialog"] [data-testid="tweetTextarea_0"]',
    '[role="dialog"] [role="textbox"][contenteditable="true"]',
    '[role="dialog"] [contenteditable="true"]',
    '[aria-modal="true"] [data-testid="tweetTextarea_0"]',
    '[aria-modal="true"] [role="textbox"][contenteditable="true"]',
    '[aria-modal="true"] [contenteditable="true"]',
    '[data-testid="sheetDialog"] [data-testid="tweetTextarea_0"]',
    '[data-testid="sheetDialog"] [contenteditable="true"]',
    '[data-testid="inline_reply"] [data-testid="tweetTextarea_0"]',
    '[data-testid="inline_reply"] [role="textbox"][contenteditable="true"]',
  ],

  // Tweet article element enclosing tweet content and action bar
  // Justification: standard tweet root article element
  tweetArticle: [
    'article[data-testid="tweet"]',
    'article[role="article"]',
  ],

  // Promoted / ad indicator container element
  promotedContainer: ['[data-testid="placementTracking"]'],

  // Primary feed column container
  primaryColumn: ['div[data-testid="primaryColumn"]'],

  // Tweet action bar (like, repost, reply, share buttons row)
  tweetActionBar: [
    '[data-testid="tweet"] [role="group"]',
    'article [role="group"]',
  ],

  // Tweet action numeric metric label
  // Justification: X wraps count labels in an unlabelled transition container inside action buttons
  tweetActionMetric: [
    '[role="group"] [data-testid="app-text-transition-container"]',
    '[role="group"] button span:has(span)',
  ],

  // Tweet analytics / view count button
  analyticsButton: [
    '[role="group"] a[href*="/analytics"]',
    '[role="group"] [data-testid="analytics"]',
    '[role="group"] [aria-label*="Views" i]',
  ],

  // Tweet detail expanded stats row (reposts, quotes, likes counts)
  // Justification: tweet detail expanded stats block is a div wrapping retweet/like anchor links
  detailStatsRow: [
    'article div:has(> a[href$="/retweets"])',
    'article a[href$="/retweets"]',
    'article a[href$="/likes"]',
  ],

  // Profile page follower counts
  profileFollowerCounts: [
    'a[href$="/verified_followers"]',
    'a[href$="/followers"]',
  ],

  // Profile page following counts
  profileFollowingCounts: [
    'a[href$="/following"]',
  ],

  // Native hover tooltip
  nativeTooltip: [
    '[role="tooltip"]',
    'div[role="tooltip"]',
  ],

  // Right sidebar column container
  sidebarColumn: [
    'div[data-testid="sidebarColumn"]',
    '[role="complementary"]',
  ],

  // "What's Happening" / Trends module
  // Justification: Trends block is a section inside sidebarColumn containing trend items or matching aria labels
  trendsModule: [
    'div[data-testid="sidebarColumn"] section:has([data-testid="trend"])',
    '[aria-label*="Trending" i]',
    '[aria-label*="What’s happening" i]',
    '[aria-label*="What\'s happening" i]',
  ],

  // "Who to Follow" module
  // Justification: Who to Follow block is an aside or section containing UserCell items
  whoToFollowModule: [
    'div[data-testid="sidebarColumn"] aside:has([data-testid="UserCell"])',
    'section:has([data-testid="UserCell"])',
    '[aria-label*="Who to follow" i]',
  ],

  // Premium / Verified subscription module
  premiumModule: [
    'div[data-testid="sidebarColumn"] aside:has(a[href*="/i/premium_sign_up"])',
    'div[data-testid="sidebarColumn"] aside:has(a[href*="/verified"])',
    'div[data-testid="sidebarColumn"] section:has(a[href*="/i/premium_sign_up"])',
    '[data-testid="flex-prompt"]',
  ],

  // Home feed tab list container (For You / Following / pinned Lists)
  // Justification: X leaves the tablist wrapper unlabelled without a data-testid; role="tablist" is the
  // documented ARIA contract for this structural container.
  tabList: [
    'div[data-testid="primaryColumn"] [role="tablist"]',
    '[role="tablist"]',
    'nav[role="tablist"]',
  ],

  // "For You" tab (first child of the home tablist, CLEAN-04, D-05)
  // Justification: X's tab elements carry no data-testid; :nth-child positional targeting is the only
  // way to distinguish "For You" (first) from "Following" (second) and pinned Lists (third+).
  forYouTab: [
    '[role="tablist"] > :nth-child(1) [role="tab"]',
    '[role="tablist"] [role="tab"]:first-of-type',
  ],

  // "Following" tab (second child of the home tablist, CLEAN-04, D-05)
  // Justification: same positional rationale as forYouTab above.
  followingTab: [
    '[role="tablist"] > :nth-child(2) [role="tab"]',
    '[role="tablist"] [role="tab"]:nth-of-type(2)',
  ],
} as const;

export type SelectorKey = keyof typeof SELECTORS;

/**
 * Resolves the first matching Element from the ordered candidate chain.
 * Returns null on total miss; never throws.
 */
export function resolve(name: SelectorKey, root: ParentNode = document): Element | null {
  const candidates = SELECTORS[name];
  if (!candidates) return null;

  for (const candidate of candidates) {
    try {
      const match = root.querySelector(candidate);
      if (match) return match;
    } catch {
      // Invariant: resolve never throws
    }
  }
  return null;
}

/**
 * Resolves all Elements matching the first successful candidate in the chain.
 * Returns an empty array on total miss; never throws.
 */
export function resolveAll(name: SelectorKey, root: ParentNode = document): Element[] {
  const candidates = SELECTORS[name];
  if (!candidates) return [];

  for (const candidate of candidates) {
    try {
      const matches = root.querySelectorAll(candidate);
      if (matches.length > 0) {
        return Array.from(matches);
      }
    } catch {
      // Invariant: resolveAll never throws
    }
  }
  return [];
}

/**
 * Creates a feature-scoped resolve/resolveAll interface that reports hits and misses.
 */
export function withFeature(featureId: string) {
  return {
    resolve: (name: SelectorKey, root: ParentNode = document): Element | null => {
      const match = resolve(name, root);
      if (match) {
        recordHit(featureId, name);
      } else {
        recordMiss(featureId, name);
      }
      return match;
    },
    resolveAll: (name: SelectorKey, root: ParentNode = document): Element[] => {
      const matches = resolveAll(name, root);
      if (matches.length > 0) {
        recordHit(featureId, name);
      } else {
        recordMiss(featureId, name);
      }
      return matches;
    },
  };
}
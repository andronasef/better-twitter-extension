export type SupportedBrowser = 'chrome' | 'firefox' | 'edge' | 'brave' | 'opera' | 'unknown';

export interface BrowserStoreInfo {
  browser: SupportedBrowser;
  storeName: string;
  storeUrl: string;
  reviewUrl: string;
  shareUrl: string;
  extensionUrl: string;
}

export const CWS_ID = 'hiamigdhnadbjjpmcbiommoedakgdaea';
export const CWS_STORE_URL = `https://chromewebstore.google.com/detail/${CWS_ID}`;
export const CWS_REVIEW_URL = `https://chromewebstore.google.com/detail/${CWS_ID}/reviews`;

export const FIREFOX_AMO_URL = 'https://addons.mozilla.org/firefox/addon/better-twitter/';
export const FIREFOX_REVIEW_URL = 'https://addons.mozilla.org/firefox/addon/better-twitter/reviews/';

export const DEFAULT_SHARE_TEXT =
  "I've been using Better Twitter for a cleaner, faster, distraction-free experience on X. Highly recommend trying it out! 🚀\n\n" +
  CWS_STORE_URL;

/**
 * Detects the current browser environment and returns corresponding store information.
 * An optional userAgent string can be passed for testability.
 */
export function getBrowserStoreInfo(customUserAgent?: string): BrowserStoreInfo {
  let ua = customUserAgent;
  if (typeof ua === 'undefined' && typeof navigator !== 'undefined') {
    ua = navigator.userAgent;
  }
  ua = ua || '';

  // 1. Edge
  if (/\bEdg\//i.test(ua)) {
    return {
      browser: 'edge',
      storeName: 'Chrome Web Store',
      storeUrl: CWS_STORE_URL,
      reviewUrl: CWS_REVIEW_URL,
      shareUrl: createShareIntent(DEFAULT_SHARE_TEXT),
      extensionUrl: CWS_STORE_URL,
    };
  }

  // 2. Opera
  if (/\b(OPR|Opera)\//i.test(ua)) {
    return {
      browser: 'opera',
      storeName: 'Chrome Web Store',
      storeUrl: CWS_STORE_URL,
      reviewUrl: CWS_REVIEW_URL,
      shareUrl: createShareIntent(DEFAULT_SHARE_TEXT),
      extensionUrl: CWS_STORE_URL,
    };
  }

  // 3. Firefox
  const isFirefoxExtension =
    typeof browser !== 'undefined' &&
    typeof browser.runtime?.getURL === 'function' &&
    browser.runtime.getURL('').startsWith('moz-extension://');

  if (/\bFirefox\//i.test(ua) || isFirefoxExtension) {
    return {
      browser: 'firefox',
      storeName: 'Firefox Add-ons',
      storeUrl: FIREFOX_AMO_URL,
      reviewUrl: FIREFOX_REVIEW_URL,
      shareUrl: createShareIntent(
        "I've been using Better Twitter for a cleaner, faster, distraction-free experience on X. Highly recommend trying it out! 🚀\n\n" +
          FIREFOX_AMO_URL
      ),
      extensionUrl: FIREFOX_AMO_URL,
    };
  }

  // 4. Brave
  const isBrave =
    typeof navigator !== 'undefined' &&
    ((navigator as any).brave?.isBrave || /\bBrave\//i.test(ua));
  if (isBrave) {
    return {
      browser: 'brave',
      storeName: 'Chrome Web Store',
      storeUrl: CWS_STORE_URL,
      reviewUrl: CWS_REVIEW_URL,
      shareUrl: createShareIntent(DEFAULT_SHARE_TEXT),
      extensionUrl: CWS_STORE_URL,
    };
  }

  // 5. Chrome / Default
  return {
    browser: /\bChrome\//i.test(ua) ? 'chrome' : 'unknown',
    storeName: 'Chrome Web Store',
    storeUrl: CWS_STORE_URL,
    reviewUrl: CWS_REVIEW_URL,
    shareUrl: createShareIntent(DEFAULT_SHARE_TEXT),
    extensionUrl: CWS_STORE_URL,
  };
}

/**
 * Creates an X (Twitter) post intent URL with prefilled text.
 */
export function createShareIntent(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

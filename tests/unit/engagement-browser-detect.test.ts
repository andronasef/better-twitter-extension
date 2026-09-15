import { describe, it, expect } from 'vitest';
import {
  getBrowserStoreInfo,
  createShareIntent,
  CWS_STORE_URL,
  CWS_REVIEW_URL,
  FIREFOX_AMO_URL,
  FIREFOX_REVIEW_URL,
} from '@/features/engagement/browser-detect';

describe('Browser Detection & Store URLs', () => {
  it('detects Chrome userAgent correctly and returns Chrome Web Store review URL', () => {
    const chromeUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const info = getBrowserStoreInfo(chromeUA);

    expect(info.browser).toBe('chrome');
    expect(info.storeName).toBe('Chrome Web Store');
    expect(info.reviewUrl).toBe(CWS_REVIEW_URL);
    expect(info.storeUrl).toBe(CWS_STORE_URL);
    expect(info.shareUrl).toContain('https://x.com/intent/post?text=');
  });

  it('detects Edge userAgent correctly', () => {
    const edgeUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0';
    const info = getBrowserStoreInfo(edgeUA);

    expect(info.browser).toBe('edge');
    expect(info.reviewUrl).toBe(CWS_REVIEW_URL);
  });

  it('detects Opera userAgent correctly', () => {
    const operaUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
    const info = getBrowserStoreInfo(operaUA);

    expect(info.browser).toBe('opera');
    expect(info.reviewUrl).toBe(CWS_REVIEW_URL);
  });

  it('detects Firefox userAgent correctly and returns Firefox Add-ons URLs', () => {
    const firefoxUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0';
    const info = getBrowserStoreInfo(firefoxUA);

    expect(info.browser).toBe('firefox');
    expect(info.storeName).toBe('Firefox Add-ons');
    expect(info.storeUrl).toBe(FIREFOX_AMO_URL);
    expect(info.reviewUrl).toBe(FIREFOX_REVIEW_URL);
    expect(info.extensionUrl).toBe(FIREFOX_AMO_URL);
  });

  it('handles unknown or empty userAgent gracefully with Chrome Web Store fallback', () => {
    const info = getBrowserStoreInfo('');
    expect(info.browser).toBe('unknown');
    expect(info.storeName).toBe('Chrome Web Store');
    expect(info.reviewUrl).toBe(CWS_REVIEW_URL);
  });

  it('formats createShareIntent with encoded text', () => {
    const text = 'Better Twitter is awesome! 🚀 & fun';
    const intentUrl = createShareIntent(text);

    expect(intentUrl).toBe(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
  });
});

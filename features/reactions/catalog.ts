import { customEmojiCacheItem } from '@/lib/storage';
import type { CatalogEmoji, CustomEmojiCacheEntry } from './types';

export const NOTO_API_URL = 'https://googlefonts.github.io/noto-emoji-animation/data/api.json';

let inMemoryCatalogCache: CatalogEmoji[] | null = null;

export function codepointToEmoji(codepoint: string): string {
  try {
    const codePoints = codepoint.split('_').map((hex) => parseInt(hex, 16));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '❓';
  }
}

interface RawNotoIcon {
  name: string;
  version?: number;
  popularity?: number;
  codepoint: string;
  categories?: string[];
  tags?: string[];
}

interface RawNotoApiResponse {
  icons: RawNotoIcon[];
}

export async function fetchEmojiCatalog(): Promise<CatalogEmoji[]> {
  if (inMemoryCatalogCache && inMemoryCatalogCache.length > 0) {
    return inMemoryCatalogCache;
  }

  try {
    const response = await fetch(NOTO_API_URL, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as RawNotoApiResponse;
    if (!data || !Array.isArray(data.icons)) {
      throw new Error('Invalid catalog schema returned from Google Noto API');
    }

    const parsed: CatalogEmoji[] = data.icons.map((icon) => {
      const rawTag = (icon.tags && icon.tags[0]) || '';
      const cleanName = rawTag.replace(/:/g, '').replace(/[-_]/g, ' ').trim() || icon.name.replace(/^emoji_u/, '');
      const category = (icon.categories && icon.categories[0]) || 'Symbols';
      const keywords = (icon.tags || []).map((t) => t.replace(/:/g, '').replace(/[-_]/g, ' ').trim());

      return {
        codepoint: icon.codepoint,
        emoji: codepointToEmoji(icon.codepoint),
        name: cleanName,
        category,
        keywords,
      };
    });

    inMemoryCatalogCache = parsed;
    return parsed;
  } catch (error) {
    console.error('[Better Twitter] Failed to fetch Noto emoji catalog:', error);
    throw error;
  }
}

export function searchEmojiCatalog(
  catalog: CatalogEmoji[],
  query: string,
  categoryFilter?: string | null
): CatalogEmoji[] {
  let filtered = catalog;

  if (categoryFilter && categoryFilter !== 'All') {
    const cf = categoryFilter.toLowerCase();
    filtered = filtered.filter((item) => {
      const cat = item.category.toLowerCase();
      if (cf === 'smileys') return cat.includes('smiley') || cat.includes('emotion');
      if (cf === 'gestures') return cat.includes('people') || cat.includes('gesture');
      if (cf === 'animals') return cat.includes('animal') || cat.includes('nature');
      if (cf === 'food') return cat.includes('food') || cat.includes('drink');
      if (cf === 'travel') return cat.includes('travel') || cat.includes('places');
      if (cf === 'activities') return cat.includes('activit') || cat.includes('events');
      return cat.includes(cf);
    });
  }

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return filtered;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return filtered.filter((item) => {
    const searchableText = `${item.name} ${item.category} ${item.keywords.join(' ')} ${item.codepoint}`.toLowerCase();
    return tokens.every((token) => searchableText.includes(token));
  });
}

export async function cacheCustomEmoji(
  codepoint: string,
  twemojiCodepoint?: string
): Promise<CustomEmojiCacheEntry> {
  const tCode = twemojiCodepoint || codepoint.replace(/_fe0f$/i, '');
  const nCode = codepoint;

  let twemojiSvg: string | undefined;
  let notoWebp: string | undefined;

  try {
    const svgRes = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${tCode}.svg`);
    if (svgRes.ok) {
      const svgText = await svgRes.text();
      twemojiSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
    }
  } catch (err) {
    console.warn('[Better Twitter] Failed to fetch Twemoji SVG for caching:', tCode, err);
  }

  try {
    const webpRes = await fetch(`https://fonts.gstatic.com/s/e/notoemoji/latest/${nCode}/512.webp`);
    if (webpRes.ok) {
      const arrayBuf = await webpRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuf);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        const b = bytes[i];
        if (b !== undefined) {
          binary += String.fromCharCode(b);
        }
      }
      const base64 = btoa(binary);
      notoWebp = `data:image/webp;base64,${base64}`;
    }
  } catch (err) {
    console.warn('[Better Twitter] Failed to fetch Noto WebP for caching:', nCode, err);
  }

  const entry: CustomEmojiCacheEntry = {
    twemojiSvg,
    notoWebp,
    updatedAt: Date.now(),
  };

  try {
    const currentCache = await customEmojiCacheItem.getValue();
    await customEmojiCacheItem.setValue({
      ...currentCache,
      [codepoint]: entry,
    });
  } catch (err) {
    console.warn('[Better Twitter] Failed to persist custom emoji to storage:', err);
  }

  return entry;
}

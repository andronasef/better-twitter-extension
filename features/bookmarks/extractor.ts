import type { BookmarkItem } from './types';

export interface ExtractionResult {
  items: BookmarkItem[];
  bottomCursor: string | null;
  schemaMismatch: boolean;
}

/**
 * Safely extracts normalized BookmarkItem records and pagination cursor
 * from X's live GraphQL bookmark timeline payload (BOOK-01, BOOK-02, D-15).
 */
export function extractBookmarksFromGraphql(json: unknown): ExtractionResult {
  if (!json || typeof json !== 'object') {
    return { items: [], bottomCursor: null, schemaMismatch: true };
  }

  const root = json as any;
  const dataObj = root.data && typeof root.data === 'object' ? root.data : root;

  let instructions: any[] | undefined =
    dataObj.bookmark_timeline_v2?.timeline?.instructions ??
    dataObj.bookmark_timeline?.timeline?.instructions ??
    dataObj.timeline?.instructions ??
    dataObj.instructions;

  if (!instructions || !Array.isArray(instructions)) {
    if (Array.isArray(root.instructions)) {
      instructions = root.instructions;
    } else if (Array.isArray(root.data?.instructions)) {
      instructions = root.data.instructions;
    } else {
      // Recursive fallback searching for instructions array
      const findInstructions = (obj: any): any[] | null => {
        if (!obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj.instructions)) return obj.instructions;
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'object') {
            const found = findInstructions(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };
      instructions = findInstructions(dataObj) || undefined;
    }
  }

  if (!instructions || !Array.isArray(instructions)) {
    return { items: [], bottomCursor: null, schemaMismatch: true };
  }

  const addEntriesInstruction = instructions.find(
    (inst) => inst?.type === 'TimelineAddEntries'
  );

  if (!addEntriesInstruction || !Array.isArray(addEntriesInstruction.entries)) {
    return { items: [], bottomCursor: null, schemaMismatch: true };
  }

  const items: BookmarkItem[] = [];
  let bottomCursor: string | null = null;

  for (const entry of addEntriesInstruction.entries) {
    if (!entry || typeof entry !== 'object') continue;

    const entryId = String(entry.entryId || '');

    // Check for bottom cursor
    if (entryId.startsWith('cursor-bottom-') || entryId.startsWith('cursor-bottom')) {
      const cursorVal =
        entry.content?.value ??
        entry.content?.operation?.cursor?.value ??
        entry.itemContent?.value;
      if (cursorVal) {
        bottomCursor = String(cursorVal);
      }
      continue;
    }

    // Check for tweet results
    const tweetResult = entry.itemContent?.tweet_results?.result;
    if (!tweetResult) continue;

    // Handle Tweet vs TweetWithVisibilityResults
    let tweetObj = tweetResult;
    if (tweetResult.__typename === 'TweetWithVisibilityResults' && tweetResult.tweet) {
      tweetObj = tweetResult.tweet;
    } else if (tweetResult.tweet) {
      tweetObj = tweetResult.tweet;
    }

    const restId = tweetObj.rest_id || tweetObj.id;
    if (!restId) continue;

    // Tweet text: check note_tweet first (expanded notes), then legacy.full_text
    let text =
      tweetObj.note_tweet?.note_tweet_results?.result?.text ??
      tweetObj.legacy?.full_text ??
      '';

    // Strip trailing t.co media URLs if media entities exist
    const mediaEntities =
      tweetObj.legacy?.extended_entities?.media ??
      tweetObj.legacy?.entities?.media;

    if (Array.isArray(mediaEntities) && mediaEntities.length > 0) {
      for (const m of mediaEntities) {
        if (m?.url && text.includes(m.url)) {
          text = text.replace(m.url, '').trim();
        }
      }
    }

    // Author details
    const userResult =
      tweetObj.core?.user_results?.result?.legacy ??
      tweetObj.core?.user_results?.result?.core ??
      tweetObj.core?.user_results?.result;

    const authorName = String(userResult?.name || 'Unknown');
    let authorHandle = String(userResult?.screen_name || '');
    if (authorHandle.startsWith('@')) {
      authorHandle = authorHandle.slice(1);
    }
    const authorAvatarUrl = String(userResult?.profile_image_url_https || '');

    // Created At
    let createdAt = Date.now();
    if (tweetObj.legacy?.created_at) {
      const parsed = Date.parse(tweetObj.legacy.created_at);
      if (!isNaN(parsed)) {
        createdAt = parsed;
      }
    }

    // Media URLs (max 4, never store raw image data per D-15)
    const mediaUrls: string[] = [];
    if (Array.isArray(mediaEntities)) {
      for (const m of mediaEntities) {
        if (m?.media_url_https && typeof m.media_url_https === 'string') {
          mediaUrls.push(m.media_url_https);
          if (mediaUrls.length >= 4) break;
        }
      }
    }

    const item: BookmarkItem = {
      id: String(restId),
      text,
      authorName,
      authorHandle,
      authorAvatarUrl,
      createdAt,
      savedAt: Date.now(),
      folderIds: ['uncategorized'],
      tags: [],
      resurfaceCount: 0,
      ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
    };

    items.push(item);
  }

  return {
    items,
    bottomCursor,
    schemaMismatch: false,
  };
}

/**
 * Extracts a normalized BookmarkItem directly from a tweet DOM article element
 * (BOOK-01, fallback direct capture).
 */
export function extractBookmarkFromDom(articleEl: Element): BookmarkItem | null {
  if (!articleEl) return null;

  // Find permalink status anchor
  const permalinkAnchor = articleEl.querySelector('a[href*="/status/"]');
  if (!permalinkAnchor) return null;

  const href = permalinkAnchor.getAttribute('href') || '';
  const match = href.match(/\/status\/(\d+)/);
  if (!match || !match[1]) return null;

  const tweetId = match[1];

  // Author info
  const userNameEl = articleEl.querySelector('[data-testid="User-Name"]');
  let authorName = 'Unknown';
  let authorHandle = '';

  if (userNameEl) {
    const nameSpan = userNameEl.querySelector('span');
    if (nameSpan) {
      authorName = nameSpan.textContent?.trim() || 'Unknown';
    }
    const handleMatch = userNameEl.textContent?.match(/@([A-Za-z0-9_]+)/);
    if (handleMatch && handleMatch[1]) {
      authorHandle = handleMatch[1];
    }
  }

  if (!authorHandle) {
    const userLink = articleEl.querySelector('a[role="link"][href^="/"]');
    if (userLink) {
      const userHref = userLink.getAttribute('href')?.replace(/^\//, '') || '';
      if (userHref && !userHref.includes('/')) {
        authorHandle = userHref;
      }
    }
  }

  const avatarImg = articleEl.querySelector(
    '[data-testid="Tweet-User-Avatar"] img, img[src*="profile_images"]'
  );
  const authorAvatarUrl = avatarImg?.getAttribute('src') || '';

  // Tweet text
  const tweetTextEl = articleEl.querySelector('[data-testid="tweetText"]');
  const text = tweetTextEl?.textContent?.trim() || '';

  // Media URLs (max 4)
  const mediaUrls: string[] = [];
  const mediaImgs = articleEl.querySelectorAll(
    'img[alt="Image"], img[src*="twimg.com/media"]'
  );
  mediaImgs.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !mediaUrls.includes(src) && mediaUrls.length < 4) {
      mediaUrls.push(src);
    }
  });

  return {
    id: tweetId,
    text,
    authorName,
    authorHandle,
    authorAvatarUrl,
    createdAt: Date.now(),
    savedAt: Date.now(),
    folderIds: ['uncategorized'],
    tags: [],
    resurfaceCount: 0,
    ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
  };
}

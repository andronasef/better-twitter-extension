import { resolve } from '@/lib/selectors';
import { registerPageObserver } from '@/lib/observers';

type TweetSeenCallback = (cell: Element, tweetId: string) => void;
type TweetGoneCallback = (cell: Element) => void;

interface KnownTweet {
  cell: Element;
  tweetId: string;
}

const seenCallbacks = new Set<TweetSeenCallback>();
const goneCallbacks = new Set<TweetGoneCallback>();
const knownTweets: KnownTweet[] = [];
const seenNodes = new WeakSet<Element>();

let timelineObserver: MutationObserver | null = null;
let activeTimeline: Element | null = null;

/**
 * Extracts a numeric or string tweet ID from within a cell.
 * Looks for links to status URLs or article identifiers without reading layout.
 */
function extractTweetId(cell: Element): string | null {
  const links = Array.from(cell.getElementsByTagName('a'));
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/status\/(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Processes children of the timeline in document order.
 */
function processTimelineChildren(timeline: Element): void {
  const children = Array.from(timeline.children);
  for (const child of children) {
    const tweetId = extractTweetId(child);
    if (!tweetId) {
      continue;
    }

    const previousSeenId = child.getAttribute('data-bt-seen');

    // Dual-marking: fast-path check via WeakSet plus tweetId comparison for recycled nodes
    if (seenNodes.has(child) && previousSeenId === tweetId) {
      continue;
    }

    // Set extension-owned mark carrying the tweet ID
    child.setAttribute('data-bt-seen', tweetId);
    seenNodes.add(child);

    // Track in knownTweets (replace if existing node recycled, or push)
    const existingIndex = knownTweets.findIndex((k) => k.cell === child);
    if (existingIndex >= 0) {
      knownTweets[existingIndex] = { cell: child, tweetId };
    } else {
      knownTweets.push({ cell: child, tweetId });
    }

    // Emit to all registered subscribers
    seenCallbacks.forEach((cb) => {
      try {
        cb(child, tweetId);
      } catch (err) {
        console.error('[BetterTwitter] Error in onTweetSeen subscriber:', err);
      }
    });
  }
}

/**
 * Subscribes to new tweets seen by the pipeline.
 */
export function onTweetSeen(cb: TweetSeenCallback): () => void {
  seenCallbacks.add(cb);
  return () => seenCallbacks.delete(cb);
}

/**
 * Subscribes to tweets removed from the timeline.
 */
export function onTweetGone(cb: TweetGoneCallback): () => void {
  goneCallbacks.add(cb);
  return () => goneCallbacks.delete(cb);
}

/**
 * Replays all currently known tweets in document order to catch up a late subscriber.
 */
export function replayKnownTweets(cb: TweetSeenCallback): void {
  // Sort or ensure document order matching timeline.children
  if (activeTimeline) {
    const liveChildren = Array.from(activeTimeline.children);
    const sorted = [...knownTweets].sort(
      (a, b) => liveChildren.indexOf(a.cell) - liveChildren.indexOf(b.cell)
    );
    sorted.forEach(({ cell, tweetId }) => cb(cell, tweetId));
  } else {
    knownTweets.forEach(({ cell, tweetId }) => cb(cell, tweetId));
  }
}

/**
 * Starts the observation pipeline on the timeline container.
 */
export function startPipeline(): void {
  const timeline = resolve('timeline');
  if (!timeline) {
    return;
  }

  // If the resolved element has no style attribute, it is an unstyled placeholder.
  // Wait for the real virtualized feed.
  if (!timeline.hasAttribute('style')) {
    return;
  }

  if (activeTimeline === timeline && timelineObserver) {
    return;
  }

  activeTimeline = timeline;
  timelineObserver?.disconnect();

  // ChildList-only observer: strictly childList only, no recursive subtree watching
  timelineObserver = new MutationObserver(() => {
    if (activeTimeline) {
      processTimelineChildren(activeTimeline);
    }
  });

  timelineObserver.observe(timeline, {
    childList: true,
  });

  // Process any existing items immediately
  processTimelineChildren(timeline);

  // Observe parent of timeline to catch replacement when revisiting tabs/routes
  if (timeline.parentElement) {
    const parentObserver = new MutationObserver(() => {
      const current = resolve('timeline');
      if (current && current !== activeTimeline && current.hasAttribute('style')) {
        startPipeline();
      }
    });
    parentObserver.observe(timeline.parentElement, { childList: true });
    registerPageObserver('pipeline:parent', parentObserver);
  }
}

/**
 * Stops the pipeline and clears active timeline references.
 */
export function stopPipeline(): void {
  timelineObserver?.disconnect();
  timelineObserver = null;
  activeTimeline = null;
  knownTweets.length = 0;
}

/**
 * Resets pipeline state for unit test isolation.
 */
export function resetPipeline(): void {
  stopPipeline();
  seenCallbacks.clear();
  goneCallbacks.clear();
}
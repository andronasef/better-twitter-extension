import { resolve } from '@/lib/selectors';
import { recordHit, recordMiss } from '@/lib/diagnostics';
import { onTweetSeen, replayKnownTweets } from '@/entrypoints/x.content/pipeline';
import { hideTweetCell, clearAllHidden } from '@/lib/hide-style';

let unsubscribe: (() => void) | null = null;

/**
 * A cell is promoted if X mounted the ad placement tracker, or — for ads whose
 * card/video hasn't mounted yet — if the tweet header carries no timestamp.
 * Every organic timeline tweet renders a <time>; ads render "Ad" instead.
 * ponytail: the <time> check is language-independent, so no "Ad"/"Anzeige" text list.
 */
export function isPromoted(cell: Element): boolean {
  // Plain resolve: a miss here is the normal case (organic tweet), not a broken selector.
  if (resolve('promotedContainer', cell)) {
    recordHit('hidePromotedTweets', 'promotedContainer');
    return true;
  }
  const article = cell.querySelector('[data-testid="tweet"]');
  if (article && !article.querySelector('time')) {
    recordMiss('hidePromotedTweets', 'promotedContainer');
    return true;
  }
  return false;
}

function processTweet(cell: Element, _tweetId: string): void {
  if (!isPromoted(cell)) {
    return;
  }

  // Collapse content wrapper inside the transform-positioned cell
  const contentWrapper = cell.firstElementChild;
  if (contentWrapper) {
    hideTweetCell(cell, contentWrapper);
  }
}

export const adStripper = {
  id: 'hidePromotedTweets',

  init(): void {
    if (unsubscribe) return;
    unsubscribe = onTweetSeen(processTweet);
    replayKnownTweets(processTweet);
  },

  teardown(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    clearAllHidden();
  },
};

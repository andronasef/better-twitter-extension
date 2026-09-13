import { withFeature } from '@/lib/selectors';
import { onTweetSeen, replayKnownTweets } from '@/entrypoints/x.content/pipeline';
import { hideTweetCell, clearAllHidden } from '@/lib/hide-style';

const selectors = withFeature('hidePromotedTweets');
let unsubscribe: (() => void) | null = null;

function processTweet(cell: Element, _tweetId: string): void {
  // Check if cell contains the promoted indicator
  const promoted = selectors.resolve('promotedContainer', cell);
  if (!promoted) {
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
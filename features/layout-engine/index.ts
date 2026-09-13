import { resolve } from '@/lib/selectors';
import {
  mountMiniProfileCard,
  unmountMiniProfileCard,
} from '@/entrypoints/x.content/components/MiniProfileCard';

/**
 * Old Twitter 2015 layout controller (THEME-06, D-15).
 *
 * Visual styling for Old Twitter (3-column proportions, 46px top navbar, bordered tweet cards,
 * 4px rounded-square avatars) is driven entirely by lib/theme-engine.ts's
 * `html[data-bt-theme="old-twitter"]` CSS rules — this controller is responsible only for the
 * structural mount/unmount of the injected left-column mini profile card, never for CSS.
 *
 * Mounting is non-destructive: the card is inserted as a sibling immediately before
 * `primaryColumn`, never replacing or reparenting any of X's own DOM nodes.
 */
export const layoutEngine = {
  /** Mounts the classic mini profile card into the left column when Old Twitter is selected. */
  enableOldTwitter(): void {
    if (typeof document === 'undefined') return;
    const primary = resolve('primaryColumn');
    const target = primary?.parentElement ?? document.body;
    if (target) {
      mountMiniProfileCard(target, primary);
    }
  },

  /** Cleanly unmounts the mini profile card. Safe to call even if never mounted. */
  disableOldTwitter(): void {
    unmountMiniProfileCard();
  },
};

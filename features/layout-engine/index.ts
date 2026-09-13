import { resolve } from '@/lib/selectors';
import {
  mountMiniProfileCard,
  unmountMiniProfileCard,
} from '@/entrypoints/x.content/components/MiniProfileCard';
import {
  mountOldTwitterNavbar,
  unmountOldTwitterNavbar,
} from '@/entrypoints/x.content/components/OldTwitterNavbar';

/**
 * Old Twitter 2015 layout controller (THEME-06, D-15).
 *
 * Visual styling for Old Twitter (3-column proportions, 46px top navbar, bordered tweet cards,
 * 4px rounded-square avatars) is driven by lib/theme-engine.ts's `html[data-bt-theme="old-twitter"]`
 * CSS rules, while this controller manages the structural mount/unmount of both the classic
 * left-column mini profile dashboard card and the authentic 2015 desktop top navigation bar.
 */
export const layoutEngine = {
  /** Mounts the classic 2015 top navbar and left mini profile card when Old Twitter is selected. */
  enableOldTwitter(): void {
    if (typeof document === 'undefined') return;

    // 1. Mount authentic 2015 top navigation bar
    mountOldTwitterNavbar();

    // 2. Mount classic left-column mini profile card (omit on /messages)
    const isMessages = typeof window !== 'undefined' && window.location.pathname.startsWith('/messages');
    if (isMessages) {
      unmountMiniProfileCard();
    } else {
      const primary = resolve('primaryColumn');
      const target = primary?.parentElement ?? document.body;
      if (target) {
        mountMiniProfileCard(target, primary);
      }
    }
  },

  /** Cleanly unmounts the mini profile card and top navbar. Safe to call even if never mounted. */
  disableOldTwitter(): void {
    unmountMiniProfileCard();
    unmountOldTwitterNavbar();
  },
};

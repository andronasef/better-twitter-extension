import { injectHideStylesheet } from '@/lib/hide-style';
import { injectThemeStylesheet, applyThemeAttributes } from '@/lib/theme-engine';
import { settingsItem, bookmarkSyncItem } from '@/lib/storage';
import type { Settings, ThemeId } from '@/lib/storage';
import { startPipeline, stopPipeline } from './pipeline';
import { createSettingsDispatcher } from './dispatcher';
import { adStripper } from '@/features/ad-stripper';
import { sidebarCleaner } from '@/features/sidebar-cleaner';
import { metricsStripper, profileCountsStripper } from '@/features/metrics-stripper';
import { tabReorder, hideForYou } from '@/features/tab-reorder';
import { floatingDrawersCleaner } from '@/features/floating-drawers';
import { layoutEngine } from '@/features/layout-engine';
import { startBridge, onGraphqlShape } from './bridge-client';
import { startRouteWatcher, onRouteChange } from './route-watcher';
import { teardownPageScope, registerPageObserver } from '@/lib/observers';
import { resetDiagnosticsForPage } from '@/lib/diagnostics';
import { resolve } from '@/lib/selectors';
import { startThemeProbe } from './theme-probe';
import { initActionBarIntegration, teardownActionBarIntegration } from '@/features/bookmarks/action-bar';
import { captureEngine } from '@/features/bookmarks/capture-engine';
import { mountBookmarksHub, unmountBookmarksHub } from '@/features/bookmarks/in-page-ui';
import { isBookmarksRoute } from '@/features/bookmarks/routes';
import { initResurfacing, teardownResurfacing } from '@/features/bookmarks/resurfacing';

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  runAt: 'document_start',

  main(ctx) {
    // 1. Inject hide stylesheet synchronously before any content paints
    injectHideStylesheet();

    // 1b. Inject master theme stylesheet synchronously before any content paints (THEME-07, D-13)
    injectThemeStylesheet();

    // 2. Start MAIN-world bridge
    startBridge();

    // 3. Start theme observation probe
    startThemeProbe();

    // 4. Initialize bookmarks capture engine and action bar integration (BOOK-01, D-05)
    captureEngine.init();
    initActionBarIntegration();

    ctx.onInvalidated(() => {
      captureEngine.stopAutoScrollSync();
      teardownActionBarIntegration();
      unmountBookmarksHub();
      teardownResurfacing();
    });

    // Dev-only instrumentation for Spikes S1 and S2
    if (import.meta.env.DEV) {
      if (typeof (window as any).navigation !== 'undefined') {
        (window as any).navigation.addEventListener('navigate', (e: any) => {
          console.log('[bt:spike] Navigation API navigate event:', e?.destination?.url);
        });
      }

      onGraphqlShape((shape) => {
        console.log('[bt:spike] GraphQL shape:', shape);
      });
    }

    const dispatcher = createSettingsDispatcher({
      [adStripper.id]: adStripper,
      [sidebarCleaner.id]: sidebarCleaner,
      [metricsStripper.id]: metricsStripper,
      [profileCountsStripper.id]: profileCountsStripper,
      [tabReorder.id]: tabReorder,
      [hideForYou.id]: hideForYou,
      [floatingDrawersCleaner.id]: floatingDrawersCleaner,
    });

    let currentSettings: Settings | null = null;

    // Early settings application to documentElement to prevent FOUC
    settingsItem.getValue().then((settings) => {
      currentSettings = settings;
      if (typeof document !== 'undefined' && document.documentElement) {
        if (settings.features?.cleanSidebar) {
          document.documentElement.setAttribute('data-bt-clean-sidebar', 'true');
        }
        if (settings.features?.hideVanityMetrics) {
          document.documentElement.setAttribute('data-bt-hide-metrics', 'true');
        }
        if (settings.features?.hideProfileCounts) {
          document.documentElement.setAttribute('data-bt-hide-profile-counts', 'true');
        }
        if (settings.features?.swapHomeTabs) {
          document.documentElement.setAttribute('data-bt-swap-tabs', 'true');
        }
        if (settings.features?.hideForYouTab) {
          document.documentElement.setAttribute('data-bt-hide-for-you', 'true');
        }
        if (settings.features?.hideFloatingDrawers) {
          document.documentElement.setAttribute('data-bt-hide-drawers', 'true');
        }
      }
      // Apply theme + custom accent synchronously to prevent FOUC (THEME-07, D-13)
      applyThemeAttributes(settings.theme ?? 'default', settings.customAccent ?? null);
      dispatcher.dispatch(settings);
    });

    /**
     * Syncs the layout-engine's structural mount (Old Twitter mini profile card, THEME-06,
     * D-15) with the active theme (D-09). Minimal (THEME-05) needs no structural mount — its
     * layout is a pure CSS transform already applied via applyThemeAttributes() setting
     * data-bt-theme="minimal", which the injected stylesheet's rules key off of.
     */
    const syncLayoutEngine = (theme: ThemeId) => {
      if (theme === 'old-twitter') {
        layoutEngine.enableOldTwitter();
      } else {
        layoutEngine.disableOldTwitter();
      }
    };

    const setupPage = () => {
      // Re-run pipeline and dispatch features
      startPipeline();

      if (typeof window !== 'undefined' && document.documentElement) {
        if (window.location.pathname.startsWith('/messages')) {
          document.documentElement.setAttribute('data-bt-page', 'messages');
        } else {
          document.documentElement.removeAttribute('data-bt-page');
        }

        const path = window.location.pathname;
        if (isBookmarksRoute(path)) {
          mountBookmarksHub();
          bookmarkSyncItem.getValue().then((sync) => {
            if (sync?.status === 'syncing') {
              captureEngine.syncBookmarksBackground();
            }
          });
        } else {
          unmountBookmarksHub();
          captureEngine.stopAutoScrollSync();
        }

        if (path === '/home' || path === '/') {
          initResurfacing();
        } else {
          teardownResurfacing();
        }
      }

      if (currentSettings) {
        dispatcher.dispatch(currentSettings);
        // Re-mount the Old Twitter mini profile card on every page setup (initial load and
        // every client-side route change), since X's SPA re-renders may replace the DOM
        // subtree our sibling card was mounted into.
        syncLayoutEngine(currentSettings.theme ?? 'default');
      }

      // If timeline is not ready yet, watch for it under primary column or body
      const primary = resolve('primaryColumn') || document.body;
      if (primary) {
        const attachObserver = new MutationObserver(() => {
          const tl = resolve('timeline');
          if (tl && tl.hasAttribute('style')) {
            startPipeline();
            if (currentSettings) {
              dispatcher.dispatch(currentSettings);
            }
          }
        });
        attachObserver.observe(primary, { childList: true });
        registerPageObserver('setupPage:attach', attachObserver);
      }
    };

    const init = async () => {
      // 3. Read stored settings
      currentSettings = await settingsItem.getValue();

      // 4. Start route watcher with context
      startRouteWatcher({ ctx });

      // 5. Wire route changes: teardown page scope, stop pipeline, and re-run setup
      onRouteChange(() => {
        resetDiagnosticsForPage();
        teardownPageScope();
        unmountBookmarksHub();
        teardownResurfacing();
        stopPipeline();
        setupPage();
      });

      // 6. Initial page setup
      setupPage();

      // 7. Watch for settings updates
      settingsItem.watch((newSettings) => {
        currentSettings = newSettings;
        // Update theme + custom accent live, synchronously, without a page reload (THEME-07, D-13)
        applyThemeAttributes(newSettings.theme ?? 'default', newSettings.customAccent ?? null);
        // Live layout switching (D-09): mount/unmount the Old Twitter mini profile card
        // immediately on preset change, with zero page reload.
        syncLayoutEngine(newSettings.theme ?? 'default');
        dispatcher.dispatch(newSettings);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(), { once: true });
    } else {
      init();
    }
  },
});
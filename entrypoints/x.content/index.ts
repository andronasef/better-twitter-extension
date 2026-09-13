import { injectHideStylesheet } from '@/lib/hide-style';
import { settingsItem } from '@/lib/storage';
import type { Settings } from '@/lib/storage';
import { startPipeline, stopPipeline } from './pipeline';
import { createSettingsDispatcher } from './dispatcher';
import { adStripper } from '@/features/ad-stripper';
import { startBridge, onGraphqlShape } from './bridge-client';
import { startRouteWatcher, onRouteChange } from './route-watcher';
import { teardownPageScope, registerPageObserver } from '@/lib/observers';
import { resolve } from '@/lib/selectors';

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  runAt: 'document_start',

  main(ctx) {
    // 1. Inject hide stylesheet synchronously before any content paints
    injectHideStylesheet();

    // 2. Start MAIN-world bridge
    startBridge();

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
    });

    let currentSettings: Settings | null = null;

    const setupPage = () => {
      // Re-run pipeline and dispatch features
      startPipeline();

      if (currentSettings) {
        dispatcher.dispatch(currentSettings);
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
        teardownPageScope();
        stopPipeline();
        setupPage();
      });

      // 6. Initial page setup
      setupPage();

      // 7. Watch for settings updates
      settingsItem.watch((newSettings) => {
        currentSettings = newSettings;
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
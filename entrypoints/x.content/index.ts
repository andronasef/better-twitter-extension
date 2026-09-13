import { injectHideStylesheet } from '@/lib/hide-style';
import { settingsItem } from '@/lib/storage';
import { startPipeline } from './pipeline';
import { createSettingsDispatcher } from './dispatcher';
import { adStripper } from '@/features/ad-stripper';

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  runAt: 'document_start',

  main() {
    // 1. Inject hide stylesheet synchronously before any content paints
    injectHideStylesheet();

    const dispatcher = createSettingsDispatcher({
      [adStripper.id]: adStripper,
    });

    const init = async () => {
      // 2. Read stored settings
      const settings = await settingsItem.getValue();

      // 3. Start pipeline
      startPipeline();

      // Retry startPipeline when DOM changes in case timeline loads asynchronously
      const rootObserver = new MutationObserver(() => {
        startPipeline();
      });
      if (document.body) {
        rootObserver.observe(document.body, { childList: true });
      }

      // 4. Dispatch initial features
      dispatcher.dispatch(settings);

      // 5. Watch for settings updates
      settingsItem.watch((newSettings) => {
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
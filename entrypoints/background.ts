import { diagnosticsItem, engagementItem } from '@/lib/storage';
import { BOOKMARKS_URL } from '@/features/bookmarks/routes';
import {
  ensureAutoSyncAlarm,
  handleAutoSyncAlarm,
} from '@/features/bookmarks/auto-sync';
import {
  configureUninstallUrl,
  openWelcomePage,
  openUpdatePage,
  isMajorOrMinorUpdate,
} from '@/lib/lifecycle';

export default defineBackground(() => {
  // Configure offboarding / uninstall feedback URL
  configureUninstallUrl();

  // Initialize engagement install timestamp if not yet recorded
  engagementItem.getValue().then((eng) => {
    if (!eng || !eng.installedAt) {
      engagementItem.setValue({
        installedAt: Date.now(),
        lastShownAt: null,
        actionTaken: null,
        dismissCount: 0,
        snoozedUntil: null,
        devForceTrigger: 0,
      }).catch(() => {});
    }
  }).catch(() => {});

  // Listen for extension install or update lifecycle events
  browser.runtime.onInstalled.addListener((details) => {
    ensureAutoSyncAlarm().catch(() => {});

    if (details.reason === 'install') {
      engagementItem.setValue({
        installedAt: Date.now(),
        lastShownAt: null,
        actionTaken: null,
        dismissCount: 0,
        snoozedUntil: null,
        devForceTrigger: 0,
      }).catch(() => {});
      openWelcomePage();
    } else if (details.reason === 'update') {

      const currentVersion = browser.runtime.getManifest?.()?.version;
      if (isMajorOrMinorUpdate(details.previousVersion, currentVersion)) {
        openUpdatePage();
      }
    }
  });
  // Re-establish the periodic bookmark auto-sync alarm after a browser restart.
  browser.runtime.onStartup.addListener(() => {
    ensureAutoSyncAlarm().catch(() => {});
  });

  // Registered at top level: MV3 drops events whose listener is not attached
  // synchronously on service-worker wake.
  browser.alarms.onAlarm.addListener((alarm) => {
    handleAutoSyncAlarm(alarm).catch(() => {});
  });

  const syncBadge = async () => {
    try {
      const diag = await diagnosticsItem.getValue();
      const hasMisses = Object.keys(diag).length > 0;
      if (hasMisses) {
        browser.action.setBadgeText({ text: '•' });
        browser.action.setBadgeBackgroundColor({ color: '#E07C00' });
        browser.action.setTitle({
          title: "One feature isn't matching X's layout",
        });
      } else {
        browser.action.setBadgeText({ text: '' });
        browser.action.setTitle({ title: 'Better Twitter!' });
      }
    } catch {
      // Ignore background sync error
    }
  };

  // Sync badge on service worker startup
  syncBadge();

  // Listen for transition messages from content scripts
  browser.runtime.onMessage.addListener((message: any) => {
    if (message && message.type === 'bt:diagnostics-transition') {
      if (message.hasMisses) {
        browser.action.setBadgeText({ text: '•' });
        browser.action.setBadgeBackgroundColor({ color: '#E07C00' });
        browser.action.setTitle({
          title: "One feature isn't matching X's layout",
        });
      } else {
        browser.action.setBadgeText({ text: '' });
        browser.action.setTitle({ title: 'Better Twitter!' });
      }
    }

    if (message && message.type === 'bt:start-sync') {
      try {
        browser.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
          if (activeTab?.id) {
            browser.tabs.update(activeTab.id, { url: BOOKMARKS_URL });
          } else {
            browser.tabs.create({ url: BOOKMARKS_URL, active: true });
          }
        }).catch(() => {
          browser.tabs.create({ url: BOOKMARKS_URL, active: true });
        });
      } catch (err) {
        console.error('[BetterTwitter] Failed to navigate to bookmarks tab:', err);
      }
    }
  });
});

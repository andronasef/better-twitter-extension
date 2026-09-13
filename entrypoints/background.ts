import { diagnosticsItem } from '@/lib/storage';

export default defineBackground(() => {
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
  });
});

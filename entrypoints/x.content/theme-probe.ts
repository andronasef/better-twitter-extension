import { xThemeItem } from '@/lib/storage';
import { schemeForBackground } from '@/lib/theme';
import { registerGlobalObserver } from '@/lib/observers';

let lastSeenColor: string | null = null;

function checkAndRecordTheme(): void {
  if (!document.body) return;

  // Read inline style on body directly (layout-free)
  const currentColor = document.body.style.backgroundColor || '';
  if (currentColor === lastSeenColor) return;

  lastSeenColor = currentColor;
  const scheme = schemeForBackground(currentColor);

  xThemeItem.setValue({
    backgroundColor: currentColor,
    scheme,
    seenAt: Date.now(),
  });
}

/**
 * Starts observing body background color changes for theme derivation.
 * Registered in global scope to survive client-side navigations.
 */
export function startThemeProbe(): void {
  const attachToBody = () => {
    if (!document.body) return;

    checkAndRecordTheme();

    const bodyObserver = new MutationObserver(() => {
      checkAndRecordTheme();
    });

    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });

    registerGlobalObserver('theme:body', bodyObserver);
  };

  if (document.body) {
    attachToBody();
  } else {
    const docObserver = new MutationObserver(() => {
      if (document.body) {
        docObserver.disconnect();
        attachToBody();
      }
    });
    docObserver.observe(document.documentElement, { childList: true });
    registerGlobalObserver('theme:doc-wait', docObserver);
  }
}

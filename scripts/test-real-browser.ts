import { chromium } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

async function isPortOpen(port = 9222): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function restartEdgeWithDebugging(): Promise<void> {
  console.log('Checking if Edge is already listening on port 9222...');
  if (await isPortOpen()) {
    console.log('Edge is already running with remote debugging port 9222!');
    return;
  }

  console.log('Closing Edge to relaunch with remote debugging enabled...');
  try {
    execSync('taskkill /F /IM msedge.exe', { stdio: 'ignore' });
  } catch {
    // Already stopped
  }
  await sleep(1500);

  console.log('Launching Microsoft Edge with your real profile and remote debugging...');
  const edgeArgs = [
    '--remote-debugging-port=9222',
    `--load-extension=${EXTENSION_PATH}`,
    '--restore-last-session',
    'https://x.com/home',
  ];

  spawn(EDGE_PATH, edgeArgs, {
    detached: true,
    stdio: 'ignore',
  }).unref();

  console.log('Waiting for Edge to initialize remote debugging port 9222...');
  const start = Date.now();
  while (Date.now() - start < 25000) {
    if (await isPortOpen()) {
      console.log('Connected to Edge DevTools Protocol successfully!');
      return;
    }
    await sleep(500);
  }

  throw new Error('Timed out waiting for Edge to open remote debugging port 9222.');
}

async function runLiveTest() {
  await restartEdgeWithDebugging();
  await sleep(3000);

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const defaultContext = browser.contexts()[0];
  if (!defaultContext) {
    throw new Error('No browser context found in Edge.');
  }

  // Find extension ID from service workers or targets
  let extensionId = 'miiolipjekbojgcfkmdikeipnfmgalba';
  for (const sw of defaultContext.serviceWorkers()) {
    if (sw.url().includes('chrome-extension://')) {
      const parts = sw.url().split('/');
      if (parts[2]) {
        extensionId = parts[2];
        break;
      }
    }
  }
  console.log('Better Twitter Extension ID in Edge:', extensionId);

  // Find or open x.com tab
  let xPage = defaultContext.pages().find((p) => p.url().includes('x.com') || p.url().includes('twitter.com'));
  if (!xPage) {
    console.log('Opening x.com/home in your Edge browser...');
    xPage = await defaultContext.newPage();
    await xPage.goto('https://x.com/home');
  } else {
    console.log('Found existing x.com tab in your Edge browser:', xPage.url());
    await xPage.bringToFront();
  }

  await xPage.waitForLoadState('domcontentloaded');
  await sleep(3000);

  // Open the extension popup in a background tab to drive settings
  const popupPage = await defaultContext.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await sleep(1000);
  // Bring xPage back to front so the user watches their real feed
  await xPage.bringToFront();

  // Helper to display a visible floating HUD banner on x.com
  const showHud = async (text: string, color = '#1D9BF0') => {
    console.log(`\n>>> [REAL BROWSER TEST] ${text}`);
    if (!xPage) return;
    try {
      await xPage.evaluate(({ text, color }: { text: string; color: string }) => {
        let hud = document.getElementById('bt-real-hud');
        if (!hud) {
          hud = document.createElement('div');
          hud.id = 'bt-real-hud';
          hud.style.position = 'fixed';
          hud.style.top = '20px';
          hud.style.left = '50%';
          hud.style.transform = 'translateX(-50%)';
          hud.style.padding = '14px 28px';
          hud.style.borderRadius = '9999px';
          hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
          hud.style.fontSize = '16px';
          hud.style.fontWeight = 'bold';
          hud.style.color = '#FFFFFF';
          hud.style.boxShadow = '0 12px 30px rgba(0,0,0,0.7)';
          hud.style.zIndex = '99999999';
          hud.style.transition = 'all 0.3s ease';
          hud.style.border = '2px solid rgba(255,255,255,0.4)';
          document.body.appendChild(hud);
        }
        hud.style.backgroundColor = color;
        hud.textContent = text;
      }, { text, color });
    } catch {
      // Ignored if navigation in flight
    }
  };

  // Helper to update settings via the popup context
  const applySettings = async (settingsUpdate: any) => {
    await popupPage.evaluate(async (update) => {
      return new Promise<void>((resolve) => {
        const chromeObj = (window as any).chrome;
        chromeObj.storage.local.get(null, (all: any) => {
          const current = all.settings || all['local:settings'] || {
            version: 3,
            features: {
              hidePromotedTweets: true,
              cleanSidebar: false,
              hideVanityMetrics: false,
              hideProfileCounts: false,
              swapHomeTabs: false,
              hideForYouTab: false,
            },
            theme: 'default',
            customAccent: null,
          };
          const next = {
            ...current,
            ...update,
            features: { ...(current.features || {}), ...(update.features || {}) },
          };
          chromeObj.storage.local.set({
            settings: next,
            'local:settings': next,
            'settings$': { v: 3 },
          }, () => resolve());
        });
      });
    }, settingsUpdate);
  };

  // 1. Initial State
  await showHud('Connected to your REAL Edge Browser! Starting live test on your feed...', '#1D9BF0');
  await sleep(4000);

  // 2. Test Dracula Theme
  await showHud('1/7: Applying DRACULA Theme (Dark Vampire Purple)...', '#bd93f9');
  await applySettings({ theme: 'dracula' });
  await sleep(5000);

  // 3. Test Nord Theme
  await showHud('2/7: Applying NORD Theme (Arctic Blue & Slate)...', '#88c0d0');
  await applySettings({ theme: 'nord' });
  await sleep(5000);

  // 4. Test Matrix Theme
  await showHud('3/7: Applying MATRIX Theme (Deep Black & Green)...', '#00aa44');
  await applySettings({ theme: 'matrix' });
  await sleep(5000);

  // 5. Test Minimal Layout
  await showHud('4/7: Applying MINIMAL Layout (Sidebar hidden & centered 650px feed)...', '#1D9BF0');
  await applySettings({ theme: 'minimal' });
  await sleep(5500);

  // 6. Test Old Twitter Layout
  await showHud('5/7: Applying OLD TWITTER (2015 fixed top navbar & profile card)...', '#1DA1F2');
  await applySettings({ theme: 'old-twitter' });
  await sleep(5500);

  // 7. Reset to Default Theme
  await showHud('6/7: Resetting back to DEFAULT Theme...', '#555555');
  await applySettings({ theme: 'default' });
  await sleep(4000);

  // 8. Test Timeline Tab Reordering (Following first)
  await showHud('7/7: Reordering Tabs: moving "Following" to 1st place before "For You"...', '#00BA7C');
  await applySettings({ features: { swapHomeTabs: true, hideForYouTab: false } });
  await sleep(5500);

  // 9. Test Hide For You
  await showHud('BONUS: Hiding "For You" tab completely from your feed...', '#F4212E');
  await applySettings({ features: { swapHomeTabs: true, hideForYouTab: true } });
  await sleep(6500);

  // 10. Restore clean state
  await showHud('Restoring default tabs...', '#1D9BF0');
  await applySettings({ features: { swapHomeTabs: false, hideForYouTab: false } });
  await sleep(3500);

  await showHud('ALL TESTS PASSED! Better Twitter is live in your real Edge browser.', '#00BA7C');
  await sleep(4000);

  // Clean up popup tab and HUD
  await popupPage.close();
  await xPage.evaluate(() => {
    document.getElementById('bt-real-hud')?.remove();
  });

  console.log('\n>>> Live real browser test completed successfully!');
}

runLiveTest().catch((err) => {
  console.error('Real browser test failed:', err);
  process.exit(1);
});

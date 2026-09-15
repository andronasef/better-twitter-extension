export const UNINSTALL_FEEDBACK_URL = 'https://bettertwitter.andronasef.com/uninstall';
export const FEATUREBASE_URL = 'https://bettertwitter.featurebase.app/';
export const X_HOME_URL = 'https://x.com/home';
export const GITHUB_REPO_URL = 'https://github.com/andronasef/better-twitter-extension';
export const PRIVACY_POLICY_URL = 'https://github.com/andronasef/better-twitter-extension/blob/main/PRIVACY.md';
export const PORTFOLIO_URL = 'https://andronasef.com';

/**
 * Parses a semantic version string (e.g., "0.1.0" or "v1.2.3") into [major, minor, patch].
 */
export function parseSemVer(version?: string): [number, number, number] | null {
  if (!version) return null;
  const clean = version.trim().replace(/^v/, '');
  const parts = clean.split('.').map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some((p) => isNaN(p))) {
    return null;
  }
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Determines whether an update represents a major or minor version bump (not just a patch).
 * Used to avoid spamming users with full tab takeovers on tiny bugfix updates.
 */
export function isMajorOrMinorUpdate(previousVersion?: string, currentVersion?: string): boolean {
  const prev = parseSemVer(previousVersion);
  const curr = parseSemVer(currentVersion);

  if (!prev || !curr) return false;

  // Major bump (e.g. 0.x -> 1.x or 1.x -> 2.x)
  if (curr[0] > prev[0]) return true;

  // Minor bump within same major (e.g. 0.1.x -> 0.2.x)
  if (curr[0] === prev[0] && curr[1] > prev[1]) return true;

  return false;
}

/**
 * Opens the onboarding / welcome page in a new browser tab.
 */
export async function openWelcomePage(): Promise<void> {
  if (typeof browser !== 'undefined' && browser.tabs?.create && browser.runtime?.getURL) {
    try {
      const url = browser.runtime.getURL('/welcome.html');
      await browser.tabs.create({ url });
    } catch (err) {
      console.error('[BetterTwitter] Failed to open welcome page:', err);
    }
  }
}

/**
 * Opens the release notes / update page in a new browser tab.
 */
export async function openUpdatePage(): Promise<void> {
  if (typeof browser !== 'undefined' && browser.tabs?.create && browser.runtime?.getURL) {
    try {
      const url = browser.runtime.getURL('/update.html');
      await browser.tabs.create({ url });
    } catch (err) {
      console.error('[BetterTwitter] Failed to open update page:', err);
    }
  }
}

/**
 * Configures the uninstall feedback survey URL in the browser.
 */
export async function configureUninstallUrl(): Promise<void> {
  if (typeof browser !== 'undefined' && browser.runtime?.setUninstallURL) {
    try {
      await browser.runtime.setUninstallURL(UNINSTALL_FEEDBACK_URL);
    } catch (err) {
      console.warn('[BetterTwitter] Failed to set uninstall URL:', err);
    }
  }
}

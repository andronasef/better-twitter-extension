import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseSemVer,
  isMajorOrMinorUpdate,
  openWelcomePage,
  openUpdatePage,
  configureUninstallUrl,
  UNINSTALL_FEEDBACK_URL,
} from '@/lib/lifecycle';

describe('Lifecycle Utilities', () => {
  describe('parseSemVer', () => {
    it('parses standard semver strings', () => {
      expect(parseSemVer('0.1.0')).toEqual([0, 1, 0]);
      expect(parseSemVer('1.2.3')).toEqual([1, 2, 3]);
      expect(parseSemVer('v2.0.4')).toEqual([2, 0, 4]);
    });

    it('returns null for undefined or malformed inputs', () => {
      expect(parseSemVer(undefined)).toBeNull();
      expect(parseSemVer('')).toBeNull();
      expect(parseSemVer('invalid')).toBeNull();
      expect(parseSemVer('1')).toBeNull();
    });
  });

  describe('isMajorOrMinorUpdate', () => {
    it('returns true on major version bumps', () => {
      expect(isMajorOrMinorUpdate('0.1.0', '1.0.0')).toBe(true);
      expect(isMajorOrMinorUpdate('1.0.0', '2.0.0')).toBe(true);
    });

    it('returns true on minor version bumps', () => {
      expect(isMajorOrMinorUpdate('0.1.0', '0.2.0')).toBe(true);
      expect(isMajorOrMinorUpdate('1.1.5', '1.2.0')).toBe(true);
    });

    it('returns false on patch version bumps', () => {
      expect(isMajorOrMinorUpdate('0.1.0', '0.1.1')).toBe(false);
      expect(isMajorOrMinorUpdate('1.2.3', '1.2.4')).toBe(false);
    });

    it('returns false when versions are identical or downgrade', () => {
      expect(isMajorOrMinorUpdate('0.1.0', '0.1.0')).toBe(false);
      expect(isMajorOrMinorUpdate('0.2.0', '0.1.9')).toBe(false);
    });

    it('returns false for missing or invalid previous version', () => {
      expect(isMajorOrMinorUpdate(undefined, '0.1.0')).toBe(false);
      expect(isMajorOrMinorUpdate('invalid', '0.1.0')).toBe(false);
    });
  });

  describe('Page opening and uninstall configuration', () => {
    beforeEach(() => {
      vi.spyOn(browser.runtime, 'getURL').mockImplementation(
        (path: string) => `chrome-extension://test-id/${path.replace(/^\//, '')}`,
      );
      browser.runtime.setUninstallURL = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(browser.tabs, 'create').mockResolvedValue({ id: 1 } as any);
    });

    it('openWelcomePage creates a tab with welcome.html', async () => {
      await openWelcomePage();
      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/welcome.html',
      });
    });

    it('openUpdatePage creates a tab with update.html', async () => {
      await openUpdatePage();
      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/update.html',
      });
    });

    it('configureUninstallUrl sets the feedback survey URL', async () => {
      await configureUninstallUrl();
      expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(UNINSTALL_FEEDBACK_URL);
    });
  });
});

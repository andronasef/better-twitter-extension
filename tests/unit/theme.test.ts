import { describe, it, expect, beforeEach } from 'vitest';
import { schemeForBackground, resolveScheme } from '@/lib/theme';
import type { XTheme } from '@/lib/storage';

describe('theme derivation and resolution', () => {
  describe('schemeForBackground', () => {
    it('maps rgb(255, 255, 255) to light', () => {
      expect(schemeForBackground('rgb(255, 255, 255)')).toBe('light');
    });

    it('maps rgb(0, 0, 0) to dark', () => {
      expect(schemeForBackground('rgb(0, 0, 0)')).toBe('dark');
    });

    it('maps rgb(5, 5, 5) to dark', () => {
      expect(schemeForBackground('rgb(5, 5, 5)')).toBe('dark');
    });

    it('maps unrecognised or slate-blue values to unknown', () => {
      expect(schemeForBackground('rgb(21, 32, 43)')).toBe('unknown');
      expect(schemeForBackground('rgb(123, 45, 67)')).toBe('unknown');
      expect(schemeForBackground('')).toBe('unknown');
    });
  });

  describe('resolveScheme', () => {
    it('returns known scheme unchanged', () => {
      const lightTheme: XTheme = {
        backgroundColor: 'rgb(255, 255, 255)',
        scheme: 'light',
        seenAt: Date.now(),
      };
      const darkTheme: XTheme = {
        backgroundColor: 'rgb(0, 0, 0)',
        scheme: 'dark',
        seenAt: Date.now(),
      };

      expect(resolveScheme(lightTheme)).toBe('light');
      expect(resolveScheme(darkTheme)).toBe('dark');
    });

    it('falls back to prefers-color-scheme when theme is null', () => {
      // In node/happy-dom, matchMedia defaults to false unless mocked
      const resolved = resolveScheme(null);
      expect(['light', 'dark']).toContain(resolved);
    });

    it('falls back to prefers-color-scheme when theme scheme is unknown', () => {
      const unknownTheme: XTheme = {
        backgroundColor: 'rgb(21, 32, 43)',
        scheme: 'unknown',
        seenAt: Date.now(),
      };
      const resolved = resolveScheme(unknownTheme);
      expect(['light', 'dark']).toContain(resolved);
    });
  });
});

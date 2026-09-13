import type { XTheme } from './storage';

export type Scheme = 'light' | 'dark' | 'unknown';

const BACKGROUND_SCHEME_MAP: Record<string, 'light' | 'dark'> = {
  'rgb(255, 255, 255)': 'light',
  'rgb(0, 0, 0)': 'dark',
  'rgb(5, 5, 5)': 'dark',
};

/**
 * Derives a scheme from an observed background color string by value.
 * An explicit 'unknown' branch is returned for any unrecognised value (e.g. slate-blue).
 */
export function schemeForBackground(backgroundColor: string): Scheme {
  const normalized = backgroundColor.trim();
  return BACKGROUND_SCHEME_MAP[normalized] ?? 'unknown';
}

/**
 * Resolves a final effective scheme ('light' | 'dark') from cached XTheme.
 * Falls back to browser prefers-color-scheme when theme is null, undefined, or 'unknown'.
 */
export function resolveScheme(cached?: XTheme | null): 'light' | 'dark' {
  if (cached && cached.scheme !== 'unknown') {
    return cached.scheme;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

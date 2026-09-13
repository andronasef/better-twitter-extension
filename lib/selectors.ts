/**
 * Selector Abstraction Layer
 *
 * Observation provenance: verified against control-panel-for-twitter@4.24.1
 * and confirmed against live x.com markup on 2026-09-13 (7-day freshness expiry: 2026-09-20).
 *
 * DOM-targeting rule (D-16 / C-9):
 * - data-testid selectors wherever X provides one.
 * - Structural combinators permitted only inside this file where X leaves a target unlabelled without a testid.
 * - Class names are strictly prohibited.
 */

import { recordHit, recordMiss } from '@/lib/diagnostics';

export const SELECTORS = {
  // Justification: X leaves the virtualized timeline feed element unlabelled without a data-testid.
  // The structural combinators below traverse the documented DOM hierarchy (primary column section -> h1 heading
  // followed by aria-labelled container -> feed div) to reliably locate the scroll container.
  timeline: [
    'div[data-testid="primaryColumn"] section > h1 + div[aria-label] > div',
    'section > h1 + div[aria-label] > div', // Fallback for modal timeline dialogs
  ],

  // In-feed virtualized cell wrapper
  cell: ['[data-testid="cellInnerDiv"]'],

  // Tweet article element
  tweet: ['[data-testid="tweet"]'],

  // Promoted / ad indicator container element
  promotedContainer: ['[data-testid="placementTracking"]'],

  // Primary feed column container
  primaryColumn: ['div[data-testid="primaryColumn"]'],
} as const;

export type SelectorKey = keyof typeof SELECTORS;

/**
 * Resolves the first matching Element from the ordered candidate chain.
 * Returns null on total miss; never throws.
 */
export function resolve(name: SelectorKey, root: ParentNode = document): Element | null {
  const candidates = SELECTORS[name];
  if (!candidates) return null;

  for (const candidate of candidates) {
    try {
      const match = root.querySelector(candidate);
      if (match) return match;
    } catch {
      // Invariant: resolve never throws
    }
  }
  return null;
}

/**
 * Resolves all Elements matching the first successful candidate in the chain.
 * Returns an empty array on total miss; never throws.
 */
export function resolveAll(name: SelectorKey, root: ParentNode = document): Element[] {
  const candidates = SELECTORS[name];
  if (!candidates) return [];

  for (const candidate of candidates) {
    try {
      const matches = root.querySelectorAll(candidate);
      if (matches.length > 0) {
        return Array.from(matches);
      }
    } catch {
      // Invariant: resolveAll never throws
    }
  }
  return [];
}

/**
 * Creates a feature-scoped resolve/resolveAll interface that reports hits and misses.
 */
export function withFeature(featureId: string) {
  return {
    resolve: (name: SelectorKey, root: ParentNode = document): Element | null => {
      const match = resolve(name, root);
      if (match) {
        recordHit(featureId, name);
      } else {
        recordMiss(featureId, name);
      }
      return match;
    },
    resolveAll: (name: SelectorKey, root: ParentNode = document): Element[] => {
      const matches = resolveAll(name, root);
      if (matches.length > 0) {
        recordHit(featureId, name);
      } else {
        recordMiss(featureId, name);
      }
      return matches;
    },
  };
}
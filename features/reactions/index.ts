import {
  initPaletteController,
  teardownPaletteController,
  PaletteController,
} from './palette-controller';

export { initPaletteController, teardownPaletteController, PaletteController };
export * from './types';
export * from './constants';
export * from './composer-prefiller';
export * from './ReactionPalette';
export * from './Toast';
export * from './catalog';

/**
 * Initializes the Reactions feature lifecycle in content scripts (REACT-01, REACT-02, D-01, D-02).
 * Returns a cleanup/teardown function.
 */
export function initReactions(): () => void {
  initPaletteController();
  return teardownReactions;
}

/**
 * Cleanly unmounts any active reactions overlays and detaches DOM listeners (D-03).
 */
export function teardownReactions(): void {
  teardownPaletteController();
}

import type { Settings } from '@/lib/storage';

export interface FeatureController {
  init: () => unknown;
  teardown: () => unknown;
}

export type FeatureMap = Record<string, FeatureController>;

export interface SettingsDispatcher {
  dispatch(settings: Settings): void;
}

/**
 * Creates a diffing settings dispatcher.
 * Diffs against the value last applied in this execution context,
 * invoking init() only when a feature flips to true and teardown() only when flipping to false.
 * Idempotent writes dispatch zero calls.
 */
export function createSettingsDispatcher(features: FeatureMap): SettingsDispatcher {
  let lastApplied: Record<string, boolean> = {};
  let isFirstDispatch = true;

  return {
    dispatch(settings: Settings): void {
      const current = settings.features || {};

      for (const [id, controller] of Object.entries(features)) {
        const isEnabled = !!current[id];
        const wasEnabled = !!lastApplied[id];

        if (isFirstDispatch) {
          if (isEnabled) {
            controller.init();
          }
        } else if (isEnabled !== wasEnabled) {
          if (isEnabled) {
            controller.init();
          } else {
            controller.teardown();
          }
        }
      }

      lastApplied = { ...current };
      isFirstDispatch = false;
    },
  };
}
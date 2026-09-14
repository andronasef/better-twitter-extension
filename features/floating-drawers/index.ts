import type { FeatureController } from '@/entrypoints/x.content/dispatcher';

export const floatingDrawersCleaner: FeatureController & { id: string } = {
  id: 'hideFloatingDrawers',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-hide-drawers', 'true');
    }
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-hide-drawers');
    }
  },
};


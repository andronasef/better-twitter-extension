import type { FeatureController } from '@/entrypoints/x.content/dispatcher';

export const sidebarCleaner: FeatureController & { id: string } = {
  id: 'cleanSidebar',

  init(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-bt-clean-sidebar', 'true');
    }
  },

  teardown(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-bt-clean-sidebar');
    }
  },
};

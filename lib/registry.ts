import type { LucideIcon } from 'lucide-react';
import { Columns3, Palette, Bookmark, Smile, Wrench } from 'lucide-react';

export interface FeatureEntry {
  id: string;
  categoryId: string;
  parentId?: string;
  title: string;
  tooltip: string; // required
  defaultEnabled: boolean;
}

export interface CategoryEntry {
  id: string;
  caption: string;
  icon: LucideIcon;
  /**
   * Categories with their own dedicated panel component (rendered directly by App.tsx rather
   * than the generic CategoryPanel/ToggleRow hierarchy) are exempt from TileGrid's "must have
   * at least one registered feature" visibility rule (D-12, UI-SPEC). "Themes" is the first
   * such category: it has no boolean feature toggles, only a preset selector and color picker.
   */
  dedicatedPanel?: boolean;
}

export const devCategory: CategoryEntry = {
  id: 'devtools',
  caption: 'Dev Tools',
  icon: Wrench,
  dedicatedPanel: true,
};

const baseCategories: CategoryEntry[] = [
  {
    id: 'timeline',
    caption: 'Timeline',
    icon: Columns3,
  },
  {
    id: 'themes',
    caption: 'Themes',
    icon: Palette,
    dedicatedPanel: true,
  },
  {
    id: 'bookmarks',
    caption: 'Bookmarks',
    icon: Bookmark,
    dedicatedPanel: true,
  },
  {
    id: 'reactions',
    caption: 'Reactions',
    icon: Smile,
    dedicatedPanel: true,
  },
];

export const categories: CategoryEntry[] = import.meta.env.DEV
  ? [...baseCategories, devCategory]
  : baseCategories;


export const features: FeatureEntry[] = [
  {
    id: 'hidePromotedTweets',
    categoryId: 'timeline',
    title: 'Hide promoted tweets',
    tooltip: 'Hides ads and promoted posts from your timeline as it loads, including ones that appear while you scroll.',
    defaultEnabled: true,
  },
  {
    id: 'cleanSidebar',
    categoryId: 'timeline',
    title: 'Clean right sidebar',
    tooltip: "Removes What's Happening trends, Who to Follow recommendations, and Premium subscription promos from the right sidebar.",
    defaultEnabled: false,
  },
  {
    id: 'hideVanityMetrics',
    categoryId: 'timeline',
    title: 'Hide vanity metrics',
    tooltip: 'Removes like, repost, and reply numbers from tweets while keeping action buttons interactive. Hides view counts and tweet detail stats.',
    defaultEnabled: false,
  },
  {
    id: 'hideProfileCounts',
    categoryId: 'timeline',
    parentId: 'hideVanityMetrics',
    title: 'Hide profile follower counts',
    tooltip: 'Hides follower and following counts on user profile pages.',
    defaultEnabled: false,
  },
  {
    id: 'swapHomeTabs',
    categoryId: 'timeline',
    title: 'Following first on Home',
    tooltip: 'Places the Following tab first and opens it automatically when you visit Home. Preserves your pinned Lists.',
    defaultEnabled: false,
  },
  {
    id: 'hideForYouTab',
    categoryId: 'timeline',
    parentId: 'swapHomeTabs',
    title: 'Hide For You tab completely',
    tooltip: 'Completely removes the algorithmic For You tab from the top navigation bar.',
    defaultEnabled: false,
  },
  {
    id: 'hideFloatingDrawers',
    categoryId: 'timeline',
    title: 'Hide floating Grok & Chat buttons',
    tooltip: 'Removes the floating Grok AI and Messages/Chat drawer buttons from the bottom right corner.',
    defaultEnabled: false,
  },
];

// Rule: hidePromotedTweets is ON by default per D-12; every toggle added by later phases defaults to false
export const featureDefaults: Record<string, boolean> = Object.fromEntries(
  features.map((f) => [f.id, f.defaultEnabled])
);
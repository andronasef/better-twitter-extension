import type { LucideIcon } from 'lucide-react';
import { Columns3 } from 'lucide-react';

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
}

export const categories: CategoryEntry[] = [
  {
    id: 'timeline',
    caption: 'Timeline',
    icon: Columns3,
  },
];

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
];

// Rule: hidePromotedTweets is ON by default per D-12; every toggle added by later phases defaults to false
export const featureDefaults: Record<string, boolean> = Object.fromEntries(
  features.map((f) => [f.id, f.defaultEnabled])
);
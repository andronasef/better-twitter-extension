import type { LucideIcon } from 'lucide-react';
import { Columns3 } from 'lucide-react';

export interface FeatureEntry {
  id: string;
  categoryId: string;
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
];

// Rule: hidePromotedTweets is ON by default per D-12; every toggle added by later phases defaults to false
export const featureDefaults: Record<string, boolean> = Object.fromEntries(
  features.map((f) => [f.id, f.defaultEnabled])
);
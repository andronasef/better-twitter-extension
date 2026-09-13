import React from 'react';
import type { CategoryEntry, FeatureEntry } from '@/lib/registry';

interface TileGridProps {
  categories: CategoryEntry[];
  features: FeatureEntry[];
  onSelectCategory: (categoryId: string) => void;
}

export function TileGrid({
  categories,
  features,
  onSelectCategory,
}: TileGridProps) {
  // Only display categories with at least one registered feature, unless the category has its
  // own dedicated panel (e.g. "Themes", which has no boolean toggles) (D-01, D-02, D-12)
  const populatedCategories = categories.filter(
    (cat) => cat.dedicatedPanel || features.some((f) => f.categoryId === cat.id)
  );

  if (populatedCategories.length === 0) {
    return (
      <div className="view-enter-grid h-full flex flex-col items-center justify-center py-8 px-4 text-center">
        <h2 className="text-[20px] font-bold text-[var(--bt-fg)]">No settings yet</h2>
        <p className="text-[13px] font-normal leading-[18.2px] text-[var(--bt-fg-muted)] mt-2 max-w-[280px]">
          Features add their own settings here. If this screen is empty, the extension didn&apos;t load properly &mdash; reload it from chrome://extensions.
        </p>
      </div>
    );
  }

  return (
    <div className="view-enter-grid grid grid-cols-3 gap-2">
      {populatedCategories.map((cat) => {
        const IconComponent = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className="group w-[104px] h-[104px] rounded-[12px] border border-[var(--bt-border)] bg-[var(--bt-surface)] p-2 flex flex-col items-center justify-center gap-2 hover:bg-[#EFF3F4] dark:hover:bg-[#1D1F23] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2"
          >
            <IconComponent className="h-6 w-6 text-[var(--bt-fg)] shrink-0" />
            <span className="text-[13px] font-normal leading-[18.2px] text-center line-clamp-2 w-full text-[var(--bt-fg-muted)] group-hover:text-[var(--bt-fg)] break-words">
              {cat.caption}
            </span>
          </button>
        );
      })}
    </div>
  );
}

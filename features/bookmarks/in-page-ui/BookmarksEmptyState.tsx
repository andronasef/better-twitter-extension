import React from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';

export interface BookmarksEmptyStateProps {
  mode: 'no-matches' | 'fresh-install';
  onClearFilters?: () => void;
  onSyncNow?: () => void;
}

export function BookmarksEmptyState({
  mode,
  onClearFilters,
  onSyncNow,
}: BookmarksEmptyStateProps) {
  if (mode === 'fresh-install') {
    return (
      <div className="py-12 px-6 flex flex-col items-center text-center max-w-[400px] mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-[rgba(29,155,240,0.1)] text-[var(--bt-accent,#1d9bf0)] flex items-center justify-center">
          <Bookmark className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[20px] font-semibold text-[var(--bt-fg,#e7e9ea)]">
            Your Bookmarks Are Empty
          </h2>
          <p className="text-[15px] text-[var(--bt-fg-muted,#71767b)] leading-relaxed">
            Sync your X bookmarks to organize them into folders, search tweet text, and rediscovery them in your timeline. Click 'Sync Bookmarks Now' to begin.
          </p>
        </div>
        {onSyncNow && (
          <button
            type="button"
            onClick={onSyncNow}
            className="h-10 px-5 rounded-full bg-[var(--bt-accent,#1d9bf0)] text-white font-semibold text-[14px] flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Bookmarks Now</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-12 px-6 flex flex-col items-center text-center max-w-[400px] mx-auto space-y-4">
      <div className="w-12 h-12 rounded-full bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] flex items-center justify-center">
        <Bookmark className="w-6 h-6 stroke-[1.5]" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-[20px] font-semibold text-[var(--bt-fg,#e7e9ea)]">
          No Bookmarks Found
        </h2>
        <p className="text-[15px] text-[var(--bt-fg-muted,#71767b)] leading-relaxed">
          No bookmarks match your search or filter. Try different search terms or click 'Clear Filters'.
        </p>
      </div>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="h-9 px-4 rounded-full bg-[var(--bt-accent,#1d9bf0)] text-white font-semibold text-[13px] hover:opacity-90 transition-opacity"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

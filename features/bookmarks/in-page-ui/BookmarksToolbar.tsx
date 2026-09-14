import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BookmarkFolder } from '../types';
import { FilterChipsRow } from './FilterChipsRow';
import { Search, X } from 'lucide-react';
import { debounce } from '../search';

export interface BookmarksToolbarProps {
  folders: BookmarkFolder[];
  countsByFolder: Record<string, number>;
  totalCount: number;
  tags: { name: string; count: number }[];
  onFilterChange: (query: string, selectedFolderId: string | null, selectedTag: string | null) => void;
  onFolderSaved?: (folder: BookmarkFolder) => void;
  onFolderDeleted?: (folderId: string) => void;
}

export function BookmarksToolbar({
  folders,
  countsByFolder,
  totalCount,
  tags,
  onFilterChange,
  onFolderSaved,
  onFolderDeleted,
}: BookmarksToolbarProps) {
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Debounced filter dispatch (150ms delay)
  const debouncedFilterRef = useRef(
    debounce((q: string, fid: string | null, tag: string | null) => {
      onFilterChange(q, fid, tag);
    }, 150)
  );

  useEffect(() => {
    debouncedFilterRef.current(query, selectedFolderId, selectedTag);
  }, [query, selectedFolderId, selectedTag]);

  const activeFilterName = useMemo(() => {
    if (selectedTag) return `#${selectedTag}`;
    if (selectedFolderId && selectedFolderId !== 'all') {
      const folder = folders.find((f) => f.id === selectedFolderId);
      return folder ? folder.name : selectedFolderId;
    }
    if (query.trim()) return `"${query.trim()}"`;
    return null;
  }, [selectedFolderId, selectedTag, query, folders]);

  const handleClearFilters = () => {
    setQuery('');
    setSelectedFolderId(null);
    setSelectedTag(null);
    onFilterChange('', null, null);
  };

  return (
    <div
      data-slot="bt-bookmarks-toolbar"
      className="sticky top-[53px] z-10 bg-[var(--bt-bg,#000000)] border-b border-[var(--bt-border,#2f3336)] min-h-[96px] p-4 flex flex-col gap-2"
    >
      {/* Search Input Row (40px pill input) */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-[var(--bt-fg-muted,#71767b)]" />
        <input
          type="text"
          placeholder="Search bookmarks by text or author..."
          aria-label="Search bookmarks by text or author"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-10 rounded-full text-[15px] bg-[var(--bt-surface,#16181c)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)] transition-colors"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search input"
            className="absolute right-3 p-1 rounded-full text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Row */}
      <FilterChipsRow
        folders={folders}
        countsByFolder={countsByFolder}
        totalCount={totalCount}
        tags={tags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={(id) => setSelectedFolderId(id)}
        onSelectTag={(t) => setSelectedTag(t)}
        onFolderSaved={onFolderSaved}
        onFolderDeleted={onFolderDeleted}
      />

      {/* Active Filter Indicator Banner */}
      {activeFilterName && (
        <div className="flex items-center justify-between pt-1 text-[13px] text-[var(--bt-fg-muted,#71767b)]">
          <span>
            Filtered by: <strong className="text-[var(--bt-fg,#e7e9ea)]">{activeFilterName}</strong>
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[var(--bt-accent,#1d9bf0)] hover:underline font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

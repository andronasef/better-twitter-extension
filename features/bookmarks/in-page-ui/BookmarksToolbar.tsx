import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BookmarkFolder } from '../types';
import { FilterChipsRow } from './FilterChipsRow';
import { FolderManagerPopover } from './FolderManagerPopover';
import { Search, X, Plus } from 'lucide-react';
import { debounce } from '../search';

export interface BookmarksToolbarProps {
  folders: BookmarkFolder[];
  countsByFolder: Record<string, number>;
  totalCount: number;
  tags: { name: string; count: number }[];
  selectedFolderId?: string | null;
  selectedTag?: string | null;
  onFilterChange: (query: string, selectedFolderId: string | null, selectedTag: string | null) => void;
  onFolderSaved?: (folder: BookmarkFolder) => void;
  onFolderDeleted?: (folderId: string) => void;
}

export function BookmarksToolbar({
  folders,
  countsByFolder,
  totalCount,
  tags,
  selectedFolderId: controlledFolderId,
  selectedTag: controlledTag,
  onFilterChange,
  onFolderSaved,
  onFolderDeleted,
}: BookmarksToolbarProps) {
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(controlledFolderId ?? null);
  const [selectedTag, setSelectedTag] = useState<string | null>(controlledTag ?? null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  useEffect(() => {
    if (controlledFolderId !== undefined) {
      setSelectedFolderId(controlledFolderId);
    }
  }, [controlledFolderId]);

  useEffect(() => {
    if (controlledTag !== undefined) {
      setSelectedTag(controlledTag);
    }
  }, [controlledTag]);

  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  // Debounced filter dispatch for text query input (150ms delay)
  const debouncedSearchRef = useRef(
    debounce((q: string, fid: string | null, tag: string | null) => {
      onFilterChangeRef.current(q, fid, tag);
    }, 150)
  );

  // Debounce text search query typing
  useEffect(() => {
    debouncedSearchRef.current(query, selectedFolderId, selectedTag);
  }, [query]);

  const handleSelectFolder = (id: string | null) => {
    setSelectedFolderId(id);
    debouncedSearchRef.current.cancel();
    onFilterChangeRef.current(query, id, selectedTag);
  };

  const handleSelectTag = (tag: string | null) => {
    setSelectedTag(tag);
    debouncedSearchRef.current.cancel();
    onFilterChangeRef.current(query, selectedFolderId, tag);
  };

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
    debouncedSearchRef.current.cancel();
    onFilterChangeRef.current('', null, null);
  };

  return (
    <div
      data-slot="bt-bookmarks-toolbar"
      className="relative z-1 border-b min-h-[96px] p-4 flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bt-bg, #000000)',
        borderColor: 'var(--bt-border, #2f3336)',
        color: 'var(--bt-fg, #e7e9ea)',
      }}
    >
      {/* Search Input & Action Row */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-[var(--bt-fg-muted,#71767b)]" />
          <input
            type="text"
            placeholder="Search bookmarks by text or author..."
            aria-label="Search bookmarks by text or author"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-full text-[14px] bg-[var(--bt-surface,#16181c)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)] transition-colors"
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

        {/* Pinned "+ New Folder" Action Button */}
        <FolderManagerPopover
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          onFolderSaved={onFolderSaved}
          onFolderDeleted={onFolderDeleted}
          trigger={
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              aria-label="Create new folder"
              className="h-10 px-3.5 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-bold bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Folder</span>
            </button>
          }
        />
      </div>

      {/* Filter Chips Row */}
      <FilterChipsRow
        folders={folders}
        countsByFolder={countsByFolder}
        totalCount={totalCount}
        tags={tags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={handleSelectFolder}
        onSelectTag={handleSelectTag}
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

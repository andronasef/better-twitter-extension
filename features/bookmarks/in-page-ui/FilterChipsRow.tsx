import React, { useState, useMemo } from 'react';
import type { BookmarkFolder } from '../types';
import { FolderManagerPopover } from './FolderManagerPopover';
import { BtPopover, BtPopoverContent, BtPopoverTrigger } from '@/components/shadow-ui/BtPopover';
import { ChevronDown, Pencil, Plus, Search, Tag, X } from 'lucide-react';

export interface FilterChipsRowProps {
  folders: BookmarkFolder[];
  countsByFolder: Record<string, number>;
  totalCount: number;
  tags: { name: string; count: number }[];
  selectedFolderId: string | null; // 'all' or folderId
  selectedTag: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onFolderSaved?: (folder: BookmarkFolder) => void;
  onFolderDeleted?: (folderId: string) => void;
}

export function FilterChipsRow({
  folders,
  countsByFolder,
  totalCount,
  tags,
  selectedFolderId,
  selectedTag,
  onSelectFolder,
  onSelectTag,
  onFolderSaved,
  onFolderDeleted,
}: FilterChipsRowProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<BookmarkFolder | null>(null);

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [moreSearchQuery, setMoreSearchQuery] = useState('');

  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const uncategorizedFolder = folders.find((f) => f.id === 'uncategorized');
  const uncategorizedCount = countsByFolder['uncategorized'] || 0;
  const isUncategorizedActive = selectedFolderId === 'uncategorized' && !selectedTag;
  const isAllActive = (selectedFolderId === null || selectedFolderId === 'all') && !selectedTag;

  const customFolders = useMemo(
    () => folders.filter((f) => f.id !== 'uncategorized'),
    [folders]
  );

  // Slicing logic: Show first 2 custom folders.
  // If a custom folder beyond slot 2 is currently selected, promote it to slot 0.
  const { visibleFolders, overflowFolders } = useMemo(() => {
    if (customFolders.length <= 3) {
      return { visibleFolders: customFolders, overflowFolders: [] };
    }

    const activeIndex = customFolders.findIndex((f) => f.id === selectedFolderId);
    if (activeIndex >= 2) {
      const activeFolder = customFolders[activeIndex];
      const otherFolders = customFolders.filter((f) => f.id !== selectedFolderId);
      const visible: BookmarkFolder[] = [];
      if (activeFolder) visible.push(activeFolder);
      if (otherFolders[0]) visible.push(otherFolders[0]);
      return {
        visibleFolders: visible,
        overflowFolders: otherFolders.slice(1),
      };
    }

    return {
      visibleFolders: customFolders.slice(0, 2),
      overflowFolders: customFolders.slice(2),
    };
  }, [customFolders, selectedFolderId]);

  const filteredOverflow = useMemo(() => {
    const q = moreSearchQuery.trim().toLowerCase();
    if (!q) return overflowFolders;
    return overflowFolders.filter((f) => f.name.toLowerCase().includes(q));
  }, [overflowFolders, moreSearchQuery]);

  const activeTagObj = useMemo(
    () => tags.find((t) => t.name === selectedTag),
    [tags, selectedTag]
  );

  const filteredTags = useMemo(() => {
    const q = tagSearchQuery.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, tagSearchQuery]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar">
      {/* "All Bookmarks" chip */}
      <button
        type="button"
        onClick={() => {
          onSelectFolder(null);
          onSelectTag(null);
        }}
        className={`h-8 px-3.5 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors cursor-pointer ${
          isAllActive
            ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)] shadow-xs'
            : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
        }`}
      >
        <span>All Bookmarks</span>
        <span className="opacity-70 text-[12px]">({totalCount})</span>
      </button>

      {/* "Uncategorized" chip */}
      {uncategorizedFolder && (
        <button
          type="button"
          onClick={() => {
            if (isUncategorizedActive) {
              onSelectFolder(null);
            } else {
              onSelectTag(null);
              onSelectFolder('uncategorized');
            }
          }}
          className={`h-8 px-3 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors cursor-pointer ${
            isUncategorizedActive
              ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)] shadow-xs'
              : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: uncategorizedFolder.color || '#71767B' }}
            aria-hidden="true"
          />
          <span className="max-w-[130px] truncate">{uncategorizedFolder.name}</span>
          <span className="opacity-70 text-[12px]">({uncategorizedCount})</span>
          {isUncategorizedActive && (
            <X className="w-3.5 h-3.5 ml-0.5 opacity-70 hover:opacity-100" />
          )}
        </button>
      )}

      {/* Visible custom folder chips */}
      {visibleFolders.map((folder) => {
        const isActive = selectedFolderId === folder.id && !selectedTag;
        const count = countsByFolder[folder.id] || 0;

        return (
          <div
            key={folder.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isActive) {
                onSelectFolder(null);
              } else {
                onSelectTag(null);
                onSelectFolder(folder.id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectFolder(isActive ? null : folder.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setFolderToEdit(folder);
              setIsManagerOpen(true);
            }}
            className={`group h-8 pl-3 pr-2 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors cursor-pointer select-none ${
              isActive
                ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)] shadow-xs'
                : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: folder.color || '#71767B' }}
              aria-hidden="true"
            />
            <span className="max-w-[130px] truncate" title={folder.name}>
              {folder.name}
            </span>
            <span className="opacity-70 text-[12px]">({count})</span>

            {/* Quick Rename & Delete button */}
            <FolderManagerPopover
              open={isManagerOpen && folderToEdit?.id === folder.id}
              onOpenChange={(open) => {
                setIsManagerOpen(open);
                if (!open) setFolderToEdit(null);
              }}
              folderToEdit={folder}
              onFolderSaved={onFolderSaved}
              onFolderDeleted={onFolderDeleted}
              trigger={
                <button
                  type="button"
                  title={`Rename or delete ${folder.name}`}
                  aria-label={`Rename or delete ${folder.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToEdit(folder);
                    setIsManagerOpen(true);
                  }}
                  className={`p-1 rounded-full text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[rgba(255,255,255,0.15)] ${
                    isManagerOpen && folderToEdit?.id === folder.id
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity ml-0.5 cursor-pointer`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              }
            />

            {isActive && (
              <button
                type="button"
                title="Clear filter"
                aria-label="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFolder(null);
                }}
                className="p-0.5 rounded-full hover:bg-[rgba(255,255,255,0.15)] ml-0.5"
              >
                <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
              </button>
            )}
          </div>
        );
      })}

      {/* "More (N) ▾" Popover Button */}
      {overflowFolders.length > 0 && (
        <div className="relative shrink-0">
          <BtPopover
            open={isMoreOpen}
            onOpenChange={(open) => {
              setIsMoreOpen(open);
              if (!open) setMoreSearchQuery('');
            }}
          >
            <BtPopoverTrigger asChild>
              <button
                type="button"
                className="h-8 px-3 rounded-full flex items-center gap-1 shrink-0 text-[13px] font-semibold bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)] transition-colors cursor-pointer"
              >
                <span>More ({overflowFolders.length})</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </BtPopoverTrigger>
            <BtPopoverContent
              side="bottom"
              align="start"
              sideOffset={6}
              className="w-[260px] p-2 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] shadow-xl z-[100000]"
            >
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--bt-border,#2f3336)] mb-2">
                <span className="text-[13px] font-bold text-[var(--bt-fg,#e7e9ea)]">
                  More Folders
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg-muted,#71767b)]">
                  {overflowFolders.length} total
                </span>
              </div>

              {overflowFolders.length > 3 && (
                <div className="relative px-1 mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--bt-fg-muted,#71767b)]" />
                  <input
                    type="text"
                    placeholder="Filter folders..."
                    value={moreSearchQuery}
                    onChange={(e) => setMoreSearchQuery(e.target.value)}
                    className="w-full h-7 pl-8 pr-2 text-[12px] rounded-md bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
                  />
                </div>
              )}

              <div className="max-h-52 overflow-y-auto space-y-0.5 px-0.5">
                {filteredOverflow.map((folder) => {
                  const count = countsByFolder[folder.id] || 0;
                  return (
                    <div
                      key={folder.id}
                      className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] cursor-pointer transition-colors text-[13px]"
                      onClick={() => {
                        onSelectTag(null);
                        onSelectFolder(folder.id);
                        setIsMoreOpen(false);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setIsMoreOpen(false);
                        setFolderToEdit(folder);
                        setIsManagerOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: folder.color || '#71767B' }}
                        />
                        <span className="truncate max-w-[140px] font-medium" title={folder.name}>
                          {folder.name}
                        </span>
                        <span className="text-[12px] opacity-60">({count})</span>
                      </div>
                      <button
                        type="button"
                        title={`Edit ${folder.name}`}
                        aria-label={`Edit ${folder.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoreOpen(false);
                          setFolderToEdit(folder);
                          setIsManagerOpen(true);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.12)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] transition-opacity"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {filteredOverflow.length === 0 && (
                  <div className="py-3 text-center text-[12px] text-[var(--bt-fg-muted,#71767b)]">
                    No matching folders
                  </div>
                )}
              </div>

              <div className="pt-2 mt-1 border-t border-[var(--bt-border,#2f3336)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    setFolderToEdit(null);
                    setIsManagerOpen(true);
                  }}
                  className="w-full h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--bt-accent,#1d9bf0)] hover:bg-[rgba(29,155,240,0.1)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create New Folder</span>
                </button>
              </div>
            </BtPopoverContent>
          </BtPopover>

          {/* Popover for editing overflow folders or creating from More menu */}
          <FolderManagerPopover
            open={isManagerOpen && (!folderToEdit || overflowFolders.some((f) => f.id === folderToEdit?.id))}
            onOpenChange={(open) => {
              setIsManagerOpen(open);
              if (!open) setFolderToEdit(null);
            }}
            folderToEdit={folderToEdit}
            onFolderSaved={onFolderSaved}
            onFolderDeleted={onFolderDeleted}
          />
        </div>
      )}

      {/* Active Tag Chip (if a tag is active) */}
      {activeTagObj && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="h-8 px-3 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)] shadow-xs cursor-pointer"
        >
          <span className="text-[var(--bt-accent,#1d9bf0)] font-bold">#</span>
          <span className="max-w-[120px] truncate">{activeTagObj.name}</span>
          <span className="opacity-70 text-[12px]">({activeTagObj.count})</span>
          <X className="w-3.5 h-3.5 ml-0.5 opacity-70 hover:opacity-100" />
        </button>
      )}

      {/* Tags Popover Trigger */}
      {tags.length > 0 && (
        <BtPopover
          open={isTagsOpen}
          onOpenChange={(open) => {
            setIsTagsOpen(open);
            if (!open) setTagSearchQuery('');
          }}
        >
          <BtPopoverTrigger asChild>
            <button
              type="button"
              className={`h-8 px-3 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors cursor-pointer ${
                selectedTag
                  ? 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent,#1d9bf0)]'
                  : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 opacity-70" />
              <span>Tags ({tags.length})</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </BtPopoverTrigger>
          <BtPopoverContent
            side="bottom"
            align="start"
            sideOffset={6}
            className="w-[240px] p-2 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] shadow-xl z-[100000]"
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--bt-border,#2f3336)] mb-2">
              <span className="text-[13px] font-bold text-[var(--bt-fg,#e7e9ea)]">
                Filter by Tag
              </span>
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg-muted,#71767b)]">
                {tags.length} total
              </span>
            </div>

            {tags.length > 5 && (
              <div className="relative px-1 mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--bt-fg-muted,#71767b)]" />
                <input
                  type="text"
                  placeholder="Filter tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="w-full h-7 pl-8 pr-2 text-[12px] rounded-md bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
                />
              </div>
            )}

            <div className="max-h-52 overflow-y-auto space-y-0.5 px-0.5">
              {filteredTags.map((tag) => {
                const isTagActive = selectedTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => {
                      onSelectFolder(null);
                      onSelectTag(isTagActive ? null : tag.name);
                      setIsTagsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors text-[13px] cursor-pointer ${
                      isTagActive
                        ? 'bg-[var(--bt-accent,#1d9bf0)]/15 text-[var(--bt-accent,#1d9bf0)] font-semibold'
                        : 'hover:bg-[rgba(255,255,255,0.06)] text-[var(--bt-fg,#e7e9ea)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[var(--bt-accent,#1d9bf0)] font-bold">#</span>
                      <span className="truncate max-w-[140px]">{tag.name}</span>
                    </div>
                    <span className="text-[12px] opacity-60">({tag.count})</span>
                  </button>
                );
              })}

              {filteredTags.length === 0 && (
                <div className="py-3 text-center text-[12px] text-[var(--bt-fg-muted,#71767b)]">
                  No matching tags
                </div>
              )}
            </div>
          </BtPopoverContent>
        </BtPopover>
      )}

      {/* Fallback popover when no overflow folders exist and manager is triggered programmatically */}
      {overflowFolders.length === 0 && isManagerOpen && !folderToEdit && (
        <div className="relative shrink-0">
          <FolderManagerPopover
            open={isManagerOpen}
            onOpenChange={(open) => {
              setIsManagerOpen(open);
              if (!open) setFolderToEdit(null);
            }}
            folderToEdit={folderToEdit}
            onFolderSaved={onFolderSaved}
            onFolderDeleted={onFolderDeleted}
          />
        </div>
      )}
    </div>
  );
}

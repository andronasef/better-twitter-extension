import React, { useState } from 'react';
import type { BookmarkFolder } from '../types';
import { FolderManagerPopover } from './FolderManagerPopover';
import { Plus } from 'lucide-react';

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<BookmarkFolder | null>(null);

  const isAllActive = (selectedFolderId === null || selectedFolderId === 'all') && !selectedTag;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none no-scrollbar">
      {/* "All Bookmarks" chip */}
      <button
        type="button"
        onClick={() => {
          onSelectFolder(null);
          onSelectTag(null);
        }}
        className={`h-8 px-3.5 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors ${
          isAllActive
            ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)]'
            : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
        }`}
      >
        <span>All Bookmarks</span>
        <span className="opacity-70 text-[12px]">({totalCount})</span>
      </button>

      {/* Folder chips */}
      {folders.map((folder) => {
        const isActive = selectedFolderId === folder.id && !selectedTag;
        const count = countsByFolder[folder.id] || 0;

        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => {
              onSelectTag(null);
              onSelectFolder(folder.id);
            }}
            onContextMenu={(e) => {
              if (folder.id !== 'uncategorized') {
                e.preventDefault();
                setFolderToEdit(folder);
                setIsPopoverOpen(true);
              }
            }}
            className={`h-8 px-3 rounded-full flex items-center gap-1.5 shrink-0 text-[13px] font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)]'
                : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:border-[var(--bt-fg-muted,#71767b)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: folder.color || '#71767B' }}
              aria-hidden="true"
            />
            <span className="max-w-[160px] truncate">{folder.name}</span>
            <span className="opacity-70 text-[12px]">({count})</span>
          </button>
        );
      })}

      {/* Tag chips */}
      {tags.map((tag) => {
        const isActive = selectedTag === tag.name;
        return (
          <button
            key={tag.name}
            type="button"
            onClick={() => {
              onSelectFolder(null);
              onSelectTag(isActive ? null : tag.name);
            }}
            className={`h-8 px-3 rounded-full flex items-center gap-1 shrink-0 text-[13px] font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--bt-surface,#16181c)] border-[1.5px] border-[var(--bt-accent,#1d9bf0)] text-[var(--bt-fg,#e7e9ea)]'
                : 'bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)]'
            }`}
          >
            <span className="text-[var(--bt-accent,#1d9bf0)]">#</span>
            <span className="max-w-[120px] truncate">{tag.name}</span>
            <span className="opacity-70 text-[12px]">({tag.count})</span>
          </button>
        );
      })}

      {/* "+ New Folder" trigger chip */}
      <FolderManagerPopover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          setIsPopoverOpen(open);
          if (!open) setFolderToEdit(null);
        }}
        folderToEdit={folderToEdit}
        onFolderSaved={onFolderSaved}
        onFolderDeleted={onFolderDeleted}
        trigger={
          <button
            type="button"
            onClick={() => {
              setFolderToEdit(null);
              setIsPopoverOpen(true);
            }}
            className="h-8 px-3 rounded-full flex items-center gap-1 shrink-0 text-[13px] font-semibold bg-[var(--bt-surface,#16181c)] border border-dashed border-[var(--bt-border,#2f3336)] text-[var(--bt-accent,#1d9bf0)] hover:border-[var(--bt-accent,#1d9bf0)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Folder</span>
          </button>
        }
      />
    </div>
  );
}

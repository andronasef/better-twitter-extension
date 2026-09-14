import React, { useState, useEffect, useMemo } from 'react';
import { BtPopover, BtPopoverContent, BtPopoverAnchor } from '@/components/shadow-ui/BtPopover';
import { foldersItem, bookmarksItem } from '@/lib/storage';
import type { BookmarkFolder, BookmarkItem } from './types';
import { Check, Plus, Search } from 'lucide-react';

const PRESET_COLORS = [
  '#1D9BF0', // Blue
  '#00BA7C', // Green
  '#FFD400', // Yellow
  '#F91880', // Pink
  '#7856FF', // Purple
  '#FF7A00', // Orange
];

export interface FolderSelectorPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRect?: { top: number; left: number; width: number; height: number } | null;
  tweetId: string;
  onClose?: () => void;
}

export function FolderSelectorPopover({
  open,
  onOpenChange,
  targetRect,
  tweetId,
  onClose,
}: FolderSelectorPopoverProps) {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [currentFolderIds, setCurrentFolderIds] = useState<string[]>(['uncategorized']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Load folders and active tweet folder assignment
  useEffect(() => {
    if (!open) return;

    let mounted = true;

    foldersItem.getValue().then((loadedFolders) => {
      if (!mounted) return;
      if (!loadedFolders || loadedFolders.length === 0) {
        setFolders([
          {
            id: 'uncategorized',
            name: 'Uncategorized',
            color: '#71767B',
            createdAt: 0,
            isDefault: true,
            resurfaceEnabled: true,
          },
        ]);
      } else {
        setFolders(loadedFolders);
      }
    });

    bookmarksItem.getValue().then((bookmarks) => {
      if (!mounted) return;
      const current = bookmarks[tweetId];
      if (current && current.folderIds && current.folderIds.length > 0) {
        setCurrentFolderIds(current.folderIds);
      } else {
        setCurrentFolderIds(['uncategorized']);
      }
    });

    return () => {
      mounted = false;
    };
  }, [open, tweetId]);

  // Filter folders by search query
  const filteredFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  // Toggle folder selection
  const toggleFolder = async (folderId: string) => {
    let nextIds: string[];

    if (currentFolderIds.includes(folderId)) {
      nextIds = currentFolderIds.filter((id) => id !== folderId);
      // If no folders selected, automatically default back to 'uncategorized'
      if (nextIds.length === 0) {
        nextIds = ['uncategorized'];
      }
    } else {
      // Add folder, removing default 'uncategorized' if other folders exist
      nextIds = [...currentFolderIds.filter((id) => id !== 'uncategorized'), folderId];
    }

    setCurrentFolderIds(nextIds);

    const bookmarks = await bookmarksItem.getValue();
    if (bookmarks[tweetId]) {
      bookmarks[tweetId] = {
        ...bookmarks[tweetId]!,
        folderIds: nextIds,
      };
      await bookmarksItem.setValue(bookmarks);
    }
  };

  // Inline folder creation
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newFolder: BookmarkFolder = {
      id: newFolderId,
      name,
      color: selectedColor || '#1D9BF0',
      createdAt: Date.now(),
      resurfaceEnabled: true,
    };

    const nextFolders = [...folders, newFolder];
    setFolders(nextFolders);
    await foldersItem.setValue(nextFolders);

    // Auto-assign new folder to the active bookmark
    const nextIds = [...currentFolderIds.filter((id) => id !== 'uncategorized'), newFolderId];
    setCurrentFolderIds(nextIds);

    const bookmarks = await bookmarksItem.getValue();
    if (bookmarks[tweetId]) {
      bookmarks[tweetId] = {
        ...bookmarks[tweetId]!,
        folderIds: nextIds,
      };
      await bookmarksItem.setValue(bookmarks);
    }

    setNewFolderName('');
    setIsCreating(false);
  };

  return (
    <BtPopover
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && onClose) {
          onClose();
        }
      }}
    >
      {targetRect && (
        <BtPopoverAnchor asChild>
          <div
            style={{
              position: 'fixed',
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              pointerEvents: 'none',
              zIndex: 99999,
            }}
          />
        </BtPopoverAnchor>
      )}

      <BtPopoverContent
        side="bottom"
        align="end"
        sideOffset={6}
        className="w-[280px] max-h-[360px] p-3 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] shadow-xl z-[100000]"
        style={{
          backgroundColor: 'var(--bt-surface, #16181c)',
          color: 'var(--bt-fg, #e7e9ea)',
          borderColor: 'var(--bt-border, #2f3336)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Title */}
        <div className="pb-2 border-b border-[var(--bt-border,#2f3336)]">
          <h3 className="text-[14px] font-semibold text-[var(--bt-fg,#e7e9ea)]">
            Save to Folders
          </h3>
        </div>

        {/* Search filter input */}
        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--bt-fg-muted,#71767b)]" />
          <input
            type="text"
            placeholder="Filter folders..."
            aria-label="Filter folders"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 text-[13px] rounded-md bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
            style={{
              backgroundColor: 'var(--bt-bg, #000000)',
              color: 'var(--bt-fg, #e7e9ea)',
              borderColor: 'var(--bt-border, #2f3336)',
            }}
          />
        </div>

        {/* Scrollable Folder Checklist */}
        <div className="max-h-[200px] overflow-y-auto space-y-0.5 py-1 pr-0.5">
          {filteredFolders.map((folder) => {
            const isChecked = currentFolderIds.includes(folder.id);
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--bt-surface-hover,rgba(255,255,255,0.06))] transition-colors text-left group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: folder.color || '#71767B' }}
                    aria-hidden="true"
                  />
                  <span className="text-[14px] font-normal text-[var(--bt-fg,#e7e9ea)] truncate">
                    {folder.name}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isChecked
                      ? 'bg-[var(--bt-accent,#1d9bf0)] border-[var(--bt-accent,#1d9bf0)] text-white'
                      : 'border-[var(--bt-border,#71767b)] group-hover:border-[var(--bt-fg,#e7e9ea)]'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer / Inline creation */}
        <div className="pt-2 border-t border-[var(--bt-border,#2f3336)] mt-2">
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              aria-label="Create new folder"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--bt-accent,#1d9bf0)] hover:underline py-1 px-1"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create Folder
            </button>
          ) : (
            <form onSubmit={handleCreateFolder} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="Folder name..."
                aria-label="New folder name"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full h-8 px-2.5 text-[13px] rounded-md bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-1 ring-white' : ''
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewFolderName('');
                    }}
                    className="text-[12px] px-2 py-1 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="text-[12px] px-2.5 py-1 rounded bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] font-semibold disabled:opacity-50 hover:opacity-90"
                  >
                    Create Folder
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </BtPopoverContent>
    </BtPopover>
  );
}

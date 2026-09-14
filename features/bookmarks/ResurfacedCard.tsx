import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Clock,
  EyeOff,
  FolderInput,
  Trash2,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { bookmarksItem, foldersItem } from '@/lib/storage';
import { removeBookmark } from './storage';
import type { BookmarkItem, BookmarkFolder } from './types';

export interface ResurfacedCardProps {
  bookmark: BookmarkItem;
  folders: BookmarkFolder[];
  onDismiss?: () => void;
  onUpdate?: (updated: BookmarkItem) => void;
}

export function ResurfacedCard({
  bookmark,
  folders,
  onDismiss,
  onUpdate,
}: ResurfacedCardProps) {
  const [currentBookmark, setCurrentBookmark] = useState<BookmarkItem>(bookmark);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'folders'>('main');
  const [availableFolders, setAvailableFolders] = useState<BookmarkFolder[]>(folders);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync folders from storage whenever menu opens
  useEffect(() => {
    if (isMenuOpen && foldersItem) {
      foldersItem
        .getValue()
        .then((fresh) => {
          if (fresh && fresh.length > 0) {
            setAvailableFolders(fresh);
          }
        })
        .catch((err) => {
          console.warn('[BT] Failed to refresh folders:', err);
        });
    }
  }, [isMenuOpen]);

  // Close menu on click outside or Escape (with shadow DOM composedPath support)
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      if (
        menuRef.current &&
        (path.includes(menuRef.current) || menuRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setIsMenuOpen(false);
      setMenuView('main');
      setIsCreatingFolder(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setMenuView('main');
        setIsCreatingFolder(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Find primary folder name for header
  const primaryFolderId = currentBookmark.folderIds?.[0] ?? 'uncategorized';
  const primaryFolder = availableFolders.find((f) => f.id === primaryFolderId) ?? {
    id: 'uncategorized',
    name: 'Uncategorized',
    color: '#71767B',
  };

  const folderName = primaryFolder.name || 'Uncategorized';

  // Format creation timestamp
  const dateFormatted = currentBookmark.createdAt
    ? new Date(currentBookmark.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  // 1. Snooze for 7 days
  const handleSnooze = async () => {
    const snoozedUntil = Date.now() + 7 * 86400000;
    const updated: BookmarkItem = {
      ...currentBookmark,
      snoozedUntil,
    };
    setCurrentBookmark(updated);
    setIsDismissed(true);

    const bookmarks = await bookmarksItem.getValue();
    bookmarks[currentBookmark.id] = updated;
    await bookmarksItem.setValue(bookmarks);

    onUpdate?.(updated);
    onDismiss?.();
  };

  // 2. Never resurface
  const handleNeverResurface = async () => {
    const updated: BookmarkItem = {
      ...currentBookmark,
      neverResurface: true,
    };
    setCurrentBookmark(updated);
    setIsDismissed(true);

    const bookmarks = await bookmarksItem.getValue();
    bookmarks[currentBookmark.id] = updated;
    await bookmarksItem.setValue(bookmarks);

    onUpdate?.(updated);
    onDismiss?.();
  };

  // 3. Move to folder
  const handleMoveToFolder = async (folderId: string) => {
    try {
      const updated: BookmarkItem = {
        ...currentBookmark,
        folderIds: [folderId],
      };
      setCurrentBookmark(updated);

      const bookmarks = await bookmarksItem.getValue();
      bookmarks[currentBookmark.id] = updated;
      await bookmarksItem.setValue(bookmarks);

      onUpdate?.(updated);
      setIsMenuOpen(false);
      setMenuView('main');
    } catch (err) {
      console.warn('[BT] Failed to move to folder:', err);
    }
  };

  // 4. Create new folder & assign
  const handleCreateAndAssignFolder = async () => {
    try {
      const trimmed = newFolderName.trim();
      if (!trimmed) return;
      const newId = `folder-${Date.now()}`;
      const newFolder: BookmarkFolder = {
        id: newId,
        name: trimmed,
        color: '#1D9BF0',
        createdAt: Date.now(),
        resurfaceEnabled: true,
      };
      const currentFolders = await foldersItem.getValue();
      const updatedFolders = [...(currentFolders || []), newFolder];
      await foldersItem.setValue(updatedFolders);
      setAvailableFolders(updatedFolders);
      await handleMoveToFolder(newId);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (err) {
      console.warn('[BT] Failed to create and assign folder:', err);
    }
  };

  // 5. Remove from bookmarks
  const handleRemove = async () => {
    setIsDismissed(true);
    await removeBookmark(currentBookmark.id);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  const tweetUrl = `https://x.com/${currentBookmark.authorHandle || 'i'}/status/${currentBookmark.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not trigger card navigation if user clicked a button, link, or the menu
    if (target.closest('button, a, [role="button"], [role="menu"], [role="menuitem"], input')) {
      return;
    }
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      data-slot="bt-resurfaced-card"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const target = e.target as HTMLElement;
          if (!target.closest('button, a, [role="button"], [role="menu"], input')) {
            e.preventDefault();
            window.open(tweetUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }}
      className="bt-resurfaced-card relative rounded-2xl border border-[var(--bt-border,#2f3336)] bg-[var(--bt-surface,#16181c)] hover:bg-[var(--bt-surface-elevated,#1e2025)]/90 hover:border-[var(--bt-accent,#1d9bf0)]/50 text-[var(--bt-fg,#e7e9ea)] shadow-lg hover:shadow-2xl overflow-visible select-none font-sans cursor-pointer transition-all duration-200"
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* 40px Top Header Banner */}
      <div
        className="h-10 min-h-[40px] px-4 flex items-center justify-between border-b border-[var(--bt-border,#2f3336)] bg-[var(--bt-surface-elevated,#1e2025)]/70 rounded-t-2xl relative"
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="text-[13px] leading-none shrink-0" aria-hidden="true">
            📌
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--bt-fg-muted,#71767b)] shrink-0">
            Resurfaced
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[var(--bt-bg,#000000)]/50 border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] truncate max-w-[200px]"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: primaryFolder.color || '#71767B' }}
            />
            <span className="truncate">{folderName}</span>
          </span>
        </div>

        {/* Overflow Menu Anchor */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Resurfaced bookmark options"
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
              setMenuView('main');
              setIsCreatingFolder(false);
            }}
            className="h-7 w-7 flex items-center justify-center rounded-full text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bt-accent,#1d9bf0)] transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* In-Card Dropdown Menu (No scroll-lock, no jump to top, immune to transform) */}
          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-[var(--bt-border,#2f3336)] bg-[var(--bt-surface,#16181c)] p-1 text-[var(--bt-fg,#e7e9ea)] shadow-2xl z-50 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {menuView === 'main' ? (
                <>
                  {/* Snooze */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSnooze();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer text-left transition-colors"
                  >
                    <Clock className="w-4 h-4 text-[var(--bt-fg-muted,#71767b)] shrink-0" />
                    <span>Snooze for 7 days</span>
                  </button>

                  {/* Never Resurface */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleNeverResurface();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer text-left transition-colors"
                  >
                    <EyeOff className="w-4 h-4 text-[var(--bt-fg-muted,#71767b)] shrink-0" />
                    <span>Don't resurface this tweet</span>
                  </button>

                  {/* Move to folder */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setMenuView('folders')}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderInput className="w-4 h-4 text-[var(--bt-fg-muted,#71767b)] shrink-0" />
                      <span>Move to folder...</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--bt-fg-muted,#71767b)]" />
                  </button>

                  <div className="my-1 h-px bg-[var(--bt-border,#2f3336)]" />

                  {/* Remove from bookmarks */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleRemove();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg text-[var(--bt-destructive,#f4212e)] hover:bg-red-500/10 cursor-pointer text-left transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Remove from bookmarks</span>
                  </button>
                </>
              ) : (
                /* Folders Subview */
                <div className="p-1 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--bt-border,#2f3336)]">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuView('main');
                        setIsCreatingFolder(false);
                      }}
                      className="flex items-center gap-1 text-[12px] text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      <span>Back</span>
                    </button>
                    <span className="text-[12px] font-semibold text-[var(--bt-fg,#e7e9ea)]">
                      Move to folder
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-0.5 pt-1">
                    {availableFolders.map((f) => {
                      const isAssigned = (currentBookmark.folderIds || []).includes(f.id) ||
                        (!currentBookmark.folderIds?.length && f.id === 'uncategorized');
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleMoveToFolder(f.id)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer text-left transition-colors"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: f.color || '#71767B' }}
                          />
                          <span className="truncate flex-1 font-medium">{f.name}</span>
                          {isAssigned && (
                            <Check className="w-4 h-4 text-[var(--bt-accent,#1d9bf0)] shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create New Folder Inline */}
                  <div className="pt-1 border-t border-[var(--bt-border,#2f3336)]">
                    {isCreatingFolder ? (
                      <div className="p-1 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Folder name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateAndAssignFolder();
                            } else if (e.key === 'Escape') {
                              setIsCreatingFolder(false);
                            }
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1.5 text-[12px] rounded-lg bg-[var(--bt-bg,#000000)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsCreatingFolder(false)}
                            className="px-2 py-1 text-[11px] rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateAndAssignFolder}
                            className="px-2.5 py-1 text-[11px] rounded bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingFolder(true)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] rounded-lg text-[var(--bt-accent,#1d9bf0)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer text-left transition-colors font-medium"
                      >
                        <span>+ New folder</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tweet Body Content */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Author Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {currentBookmark.authorAvatarUrl ? (
              <img
                src={currentBookmark.authorAvatarUrl}
                alt={currentBookmark.authorName}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--bt-border,#2f3336)] shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-border,#2f3336)] flex items-center justify-center text-[15px] font-bold text-[var(--bt-fg-muted,#71767b)] shrink-0">
                {(currentBookmark.authorName?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex flex-col leading-tight">
              <span
                dir="auto"
                className="text-[15px] font-bold text-[var(--bt-fg,#e7e9ea)] truncate text-start hover:underline"
              >
                {currentBookmark.authorName || 'User'}
              </span>
              <span className="text-[13px] text-[var(--bt-fg-muted,#71767b)] truncate">
                @{currentBookmark.authorHandle || 'anonymous'}
                {dateFormatted && ` · ${dateFormatted}`}
              </span>
            </div>
          </div>

          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View original tweet"
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-accent,#1d9bf0)] p-1.5 rounded-full hover:bg-[var(--bt-surface-elevated,#202327)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tweet Text with auto RTL / LTR */}
        {currentBookmark.text && (
          <p
            dir="auto"
            style={{ unicodeBidi: 'plaintext' }}
            className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-[var(--bt-fg,#e7e9ea)] font-normal text-start"
          >
            {currentBookmark.text}
          </p>
        )}

        {/* Media preview */}
        {currentBookmark.mediaUrls && currentBookmark.mediaUrls.length > 0 && (
          <div
            className={`grid gap-2 rounded-xl overflow-hidden max-h-[320px] border border-[var(--bt-border,#2f3336)]/70 ${
              currentBookmark.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {currentBookmark.mediaUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Tweet media"
                className="w-full h-full object-cover max-h-[320px]"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Indicators / Footer Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-[var(--bt-surface-elevated,#1e2025)]/40 border-t border-[var(--bt-border,#2f3336)]/60 rounded-b-2xl flex items-center justify-between text-[12px] text-[var(--bt-fg-muted,#71767b)]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: primaryFolder.color || '#71767B' }}
          />
          <span>Assigned: {folderName}</span>
        </span>

        {currentBookmark.resurfaceCount ? (
          <span className="px-2 py-0.5 rounded-full bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)]/50 text-[11px]">
            Resurfaced {currentBookmark.resurfaceCount}×
          </span>
        ) : null}
      </div>
    </div>
  );
}


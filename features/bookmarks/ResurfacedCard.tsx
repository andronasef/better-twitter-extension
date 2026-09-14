import React, { useState } from 'react';
import {
  MoreHorizontal,
  Clock,
  EyeOff,
  FolderInput,
  Trash2,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  BtDropdownMenu,
  BtDropdownMenuTrigger,
  BtDropdownMenuContent,
  BtDropdownMenuItem,
  BtDropdownMenuSeparator,
  BtDropdownMenuSub,
  BtDropdownMenuSubTrigger,
  BtDropdownMenuSubContent,
} from '@/components/shadow-ui/BtDropdownMenu';
import { bookmarksItem } from '@/lib/storage';
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

  // Find primary folder name for header
  const primaryFolderId = currentBookmark.folderIds?.[0] ?? 'uncategorized';
  const primaryFolder = folders.find((f) => f.id === primaryFolderId) ?? {
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
    const updated: BookmarkItem = {
      ...currentBookmark,
      folderIds: [folderId],
    };
    setCurrentBookmark(updated);

    const bookmarks = await bookmarksItem.getValue();
    bookmarks[currentBookmark.id] = updated;
    await bookmarksItem.setValue(bookmarks);

    onUpdate?.(updated);
  };

  // 4. Remove from bookmarks
  const handleRemove = async () => {
    setIsDismissed(true);
    await removeBookmark(currentBookmark.id);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  const tweetUrl = `https://x.com/${currentBookmark.authorHandle || 'i'}/status/${currentBookmark.id}`;

  return (
    <div
      data-slot="bt-resurfaced-card"
      className="bt-resurfaced-card rounded-2xl border border-[var(--bt-border,#2f3336)] border-l-[3px] border-l-[var(--bt-accent,#1d9bf0)] bg-[var(--bt-bg,#000000)] text-[var(--bt-fg,#e7e9ea)] mb-3 overflow-hidden select-none font-sans"
      style={{
        boxSizing: 'border-box',
        contain: 'content',
      }}
    >
      {/* 32px Top Header Banner */}
      <div
        className="h-8 min-h-[32px] px-3.5 flex items-center justify-between border-b border-[var(--bt-border,#2f3336)] bg-[var(--bt-surface,#16181c)]"
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className="text-[13px] leading-none shrink-0" aria-hidden="true">
            📌
          </span>
          <span className="text-[13px] font-semibold text-[var(--bt-fg,#e7e9ea)] truncate">
            Resurfaced from {folderName}
          </span>
        </div>

        {/* Overflow Menu */}
        <BtDropdownMenu>
          <BtDropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Resurfaced bookmark options"
              className="h-6 w-6 -mr-1 flex items-center justify-center rounded-full text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bt-accent,#1d9bf0)]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </BtDropdownMenuTrigger>

          <BtDropdownMenuContent align="end" className="w-56">
            <BtDropdownMenuItem onClick={handleSnooze}>
              <Clock className="h-4 w-4 mr-2" />
              <span>Snooze for 7 days</span>
            </BtDropdownMenuItem>

            <BtDropdownMenuItem onClick={handleNeverResurface}>
              <EyeOff className="h-4 w-4 mr-2" />
              <span>Don't resurface this tweet</span>
            </BtDropdownMenuItem>

            <BtDropdownMenuSub>
              <BtDropdownMenuSubTrigger>
                <FolderInput className="h-4 w-4 mr-2" />
                <span>Move to folder...</span>
              </BtDropdownMenuSubTrigger>
              <BtDropdownMenuSubContent className="w-48 max-h-56 overflow-y-auto">
                {folders.map((f) => {
                  const isAssigned = (currentBookmark.folderIds || []).includes(f.id);
                  return (
                    <BtDropdownMenuItem
                      key={f.id}
                      onClick={() => handleMoveToFolder(f.id)}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: f.color || '#71767B' }}
                      />
                      <span className="truncate flex-1">{f.name}</span>
                      {isAssigned && (
                        <Check className="h-3.5 w-3.5 ml-1.5 text-[var(--bt-accent,#1d9bf0)] shrink-0" />
                      )}
                    </BtDropdownMenuItem>
                  );
                })}
              </BtDropdownMenuSubContent>
            </BtDropdownMenuSub>

            <BtDropdownMenuSeparator />

            <BtDropdownMenuItem
              variant="destructive"
              onClick={handleRemove}
              className="text-[var(--bt-destructive,#f4212e)] focus:text-[var(--bt-destructive,#f4212e)]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Remove from bookmarks</span>
            </BtDropdownMenuItem>
          </BtDropdownMenuContent>
        </BtDropdownMenu>
      </div>

      {/* Tweet Body Content */}
      <div className="p-4 space-y-3">
        {/* Author Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentBookmark.authorAvatarUrl ? (
              <img
                src={currentBookmark.authorAvatarUrl}
                alt={currentBookmark.authorName}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--bt-border,#2f3336)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] flex items-center justify-center text-[15px] font-bold text-[var(--bt-fg-muted,#71767b)] shrink-0">
                {(currentBookmark.authorName?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-[var(--bt-fg,#e7e9ea)] truncate">
                {currentBookmark.authorName || 'User'}
              </span>
              <span className="text-[14px] text-[var(--bt-fg-muted,#71767b)] truncate">
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
            className="text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-accent,#1d9bf0)] p-1 rounded-full hover:bg-[var(--bt-surface,#16181c)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tweet Text */}
        {currentBookmark.text && (
          <p className="text-[15px] leading-[20px] whitespace-pre-wrap break-words text-[var(--bt-fg,#e7e9ea)] font-normal">
            {currentBookmark.text}
          </p>
        )}

        {/* Media preview */}
        {currentBookmark.mediaUrls && currentBookmark.mediaUrls.length > 0 && (
          <div
            className={`grid gap-2 rounded-xl overflow-hidden max-h-[280px] ${
              currentBookmark.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {currentBookmark.mediaUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Tweet media"
                className="w-full h-full object-cover max-h-[280px]"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Action Indicators / Footer Badge */}
        <div className="pt-1 flex items-center justify-between text-[12px] text-[var(--bt-fg-muted,#71767b)]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: primaryFolder.color || '#71767B' }}
            />
            <span>Assigned: {folderName}</span>
          </span>

          {currentBookmark.resurfaceCount ? (
            <span>Resurfaced {currentBookmark.resurfaceCount}×</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

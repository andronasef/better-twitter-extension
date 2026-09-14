import React, { useState, useEffect } from 'react';
import { BtPopover, BtPopoverContent, BtPopoverTrigger } from '@/components/shadow-ui/BtPopover';
import { foldersItem, bookmarksItem } from '@/lib/storage';
import type { BookmarkFolder } from '../types';
import { Check } from 'lucide-react';

const PRESET_COLORS = [
  '#1D9BF0', // Blue
  '#00BA7C', // Green
  '#FFD400', // Yellow
  '#F91880', // Pink
  '#7856FF', // Purple
  '#FF7A00', // Orange
];

export interface FolderManagerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderToEdit?: BookmarkFolder | null;
  trigger?: React.ReactNode;
  onFolderSaved?: (folder: BookmarkFolder) => void;
  onFolderDeleted?: (folderId: string) => void;
}

export function FolderManagerPopover({
  open,
  onOpenChange,
  folderToEdit,
  trigger,
  onFolderSaved,
  onFolderDeleted,
}: FolderManagerPopoverProps) {
  const isEditing = Boolean(folderToEdit && folderToEdit.id !== 'uncategorized');
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      if (folderToEdit) {
        setFolderName(folderToEdit.name);
        setSelectedColor(folderToEdit.color || PRESET_COLORS[0]);
      } else {
        setFolderName('');
        setSelectedColor(PRESET_COLORS[0]);
      }
      setConfirmDelete(false);
    }
  }, [open, folderToEdit]);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const name = folderName.trim();
    if (!name) return;

    const folders = await foldersItem.getValue();

    if (isEditing && folderToEdit) {
      const nextFolders = folders.map((f) =>
        f.id === folderToEdit.id ? { ...f, name, color: selectedColor || '#1D9BF0' } : f
      );
      await foldersItem.setValue(nextFolders);
      const updated = nextFolders.find((f) => f.id === folderToEdit.id)!;
      onFolderSaved?.(updated);
    } else {
      const newFolder: BookmarkFolder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        color: selectedColor || '#1D9BF0',
        createdAt: Date.now(),
        resurfaceEnabled: true,
      };
      const nextFolders = [...folders, newFolder];
      await foldersItem.setValue(nextFolders);
      onFolderSaved?.(newFolder);
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!folderToEdit || folderToEdit.id === 'uncategorized') return;

    // Move all bookmarks with this folder ID to 'uncategorized' (D-03)
    const bookmarks = await bookmarksItem.getValue();
    const nextBookmarks = { ...bookmarks };

    for (const [id, item] of Object.entries(nextBookmarks)) {
      if (item.folderIds.includes(folderToEdit.id)) {
        const remaining = item.folderIds.filter((fid) => fid !== folderToEdit.id);
        nextBookmarks[id] = {
          ...item,
          folderIds: remaining.length > 0 ? remaining : ['uncategorized'],
        };
      }
    }
    await bookmarksItem.setValue(nextBookmarks);

    // Remove folder from storage
    const folders = await foldersItem.getValue();
    const nextFolders = folders.filter((f) => f.id !== folderToEdit.id);
    await foldersItem.setValue(nextFolders);

    onFolderDeleted?.(folderToEdit.id);
    onOpenChange(false);
  };

  return (
    <BtPopover open={open} onOpenChange={onOpenChange}>
      {trigger && <BtPopoverTrigger asChild>{trigger}</BtPopoverTrigger>}
      <BtPopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[280px] p-4 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] shadow-xl z-[100000]"
      >
        <h3 className="text-[15px] font-semibold text-[var(--bt-fg,#e7e9ea)] pb-2 border-b border-[var(--bt-border,#2f3336)]">
          {isEditing ? 'Edit Folder' : 'Create Folder'}
        </h3>

        {!confirmDelete ? (
          <form onSubmit={handleSave} className="space-y-3 mt-3">
            <div>
              <input
                type="text"
                placeholder="Folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className="w-full h-8 px-2.5 text-[14px] rounded-md bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[var(--bt-fg-muted,#71767b)] block mb-1.5">
                Folder Color
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  >
                    {selectedColor === color && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[13px] font-semibold text-[var(--bt-destructive,#f4212e)] hover:underline"
                >
                  Delete Folder
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-[13px] px-2.5 py-1 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  disabled={!folderName.trim()}
                  className="text-[13px] px-3 py-1 rounded bg-[var(--bt-accent,#1d9bf0)] text-white font-semibold disabled:opacity-50 hover:opacity-90"
                >
                  {isEditing ? 'Rename Folder' : 'Create Folder'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-[13px] text-[var(--bt-fg,#e7e9ea)] leading-relaxed">
              Delete Folder: Are you sure you want to delete '{folderToEdit?.name}'? All bookmarks in this folder will be moved to 'Uncategorized'. No tweets will be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[13px] px-2.5 py-1 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-[13px] px-3 py-1 rounded bg-[var(--bt-destructive,#f4212e)] text-white font-semibold hover:opacity-90"
              >
                Delete Folder
              </button>
            </div>
          </div>
        )}
      </BtPopoverContent>
    </BtPopover>
  );
}

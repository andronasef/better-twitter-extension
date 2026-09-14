import React, { useState, useEffect } from 'react';
import { BtPopover, BtPopoverContent, BtPopoverTrigger, BtPopoverAnchor } from '@/components/shadow-ui/BtPopover';
import { foldersItem } from '@/lib/storage';
import { renameFolder, deleteFolder } from '../storage';
import type { BookmarkFolder } from '../types';
import { Check, Trash2 } from 'lucide-react';

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

    if (isEditing && folderToEdit) {
      const updated = await renameFolder(folderToEdit.id, name, selectedColor);
      if (updated) {
        onFolderSaved?.(updated);
      }
    } else {
      const newFolder: BookmarkFolder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        color: selectedColor || '#1D9BF0',
        createdAt: Date.now(),
        resurfaceEnabled: true,
      };
      const folders = await foldersItem.getValue();
      const nextFolders = [...folders, newFolder];
      await foldersItem.setValue(nextFolders);
      onFolderSaved?.(newFolder);
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!folderToEdit || folderToEdit.id === 'uncategorized') return;
    await deleteFolder(folderToEdit.id);
    onFolderDeleted?.(folderToEdit.id);
    onOpenChange(false);
  };

  return (
    <BtPopover open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <BtPopoverTrigger asChild>{trigger}</BtPopoverTrigger>
      ) : (
        <BtPopoverAnchor className="absolute inset-0 pointer-events-none" />
      )}
      <BtPopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[300px] p-4 rounded-2xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] text-[var(--bt-fg,#e7e9ea)] shadow-2xl z-[100000]"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--bt-border,#2f3336)]">
          <h3 className="text-[14px] font-bold text-[var(--bt-fg,#e7e9ea)] tracking-tight">
            {isEditing ? 'Edit Folder' : 'New Folder'}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete folder"
              aria-label="Delete folder"
              className="p-1.5 -mr-1 rounded-lg text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-destructive,#f4212e)] hover:bg-[rgba(244,33,46,0.1)] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete Folder</span>
            </button>
          )}
        </div>

        {!confirmDelete ? (
          <form onSubmit={handleSave} className="space-y-3.5 mt-3">
            <div>
              <input
                type="text"
                placeholder="Folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className="w-full h-9 px-3 text-[14px] rounded-lg bg-[var(--bt-surface-elevated,#000000)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)] focus:ring-1 focus:ring-[var(--bt-accent,#1d9bf0)] transition-all"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[var(--bt-fg-muted,#71767b)] block mb-1.5">
                Folder Color
              </label>
              <div className="flex items-center gap-2.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent,#1d9bf0)]"
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  >
                    {selectedColor === color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--bt-border,#2f3336)]">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={!folderName.trim()}
                className="h-8 px-4 rounded-full bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                {isEditing ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2 text-[var(--bt-destructive,#f4212e)]">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span className="text-[14px] font-bold">Delete Folder?</span>
            </div>
            <p className="text-[13px] text-[var(--bt-fg-muted,#71767b)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[var(--bt-fg,#e7e9ea)]">{folderToEdit?.name}</strong>? Bookmarks in this folder will be moved to <span className="font-semibold text-[var(--bt-fg,#e7e9ea)]">Uncategorized</span>. No bookmarks will be lost.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[var(--bt-border,#2f3336)]">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-8 px-3.5 rounded-full text-[13px] font-semibold text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-8 px-4 rounded-full bg-[var(--bt-destructive,#f4212e)] text-white text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
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

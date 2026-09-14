import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Check,
  Download,
  Upload,
  Pencil,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  bookmarksItem,
  foldersItem,
  bookmarksSettingsItem,
  bookmarkSyncItem,
} from '@/lib/storage';
import {
  getStorageUsage,
  renameFolder,
  deleteFolder,
} from '@/features/bookmarks/storage';
import {
  syncBookmarksBackground,
  resumeSync,
} from '@/features/bookmarks/capture-engine';
import type {
  BookmarkFolder,
  BookmarkItem,
  BookmarkSyncState,
  BookmarksSettings,
} from '@/features/bookmarks/types';
import { isBookmarksRoute, BOOKMARKS_URL } from '@/features/bookmarks/routes';

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Never synced';
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem>>({});
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [settings, setSettings] = useState<BookmarksSettings>({
    resurfacingEnabled: true,
    resurfacingInterval: 20,
    askFolderOnSave: true,
  });
  const [syncState, setSyncState] = useState<BookmarkSyncState>({
    status: 'idle',
    lastSyncTime: null,
    totalCaptured: 0,
    lastCheckpointTime: null,
    cursor: null,
    errorReason: null,
  });
  const [storageUsage, setStorageUsage] = useState({ bytesInUse: 0, quotaLimit: 10485760, percent: 0 });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderColor, setEditingFolderColor] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#1D9BF0');

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const [loadedBookmarks, loadedFolders, loadedSettings, loadedSync, usage] =
        await Promise.all([
          bookmarksItem.getValue(),
          foldersItem.getValue(),
          bookmarksSettingsItem.getValue(),
          bookmarkSyncItem.getValue(),
          getStorageUsage(),
        ]);

      if (!mounted) return;
      setBookmarks(loadedBookmarks || {});
      setFolders(loadedFolders || []);
      setSettings(loadedSettings || {
        resurfacingEnabled: true,
        resurfacingInterval: 20,
        askFolderOnSave: true,
      });
      setSyncState(loadedSync || {
        status: 'idle',
        lastSyncTime: null,
        totalCaptured: 0,
        lastCheckpointTime: null,
        cursor: null,
        errorReason: null,
      });
      setStorageUsage(usage);
    };

    loadAll();

    const unwatchBookmarks = bookmarksItem.watch((val) => {
      setBookmarks(val || {});
      getStorageUsage().then(setStorageUsage);
    });
    const unwatchFolders = foldersItem.watch((val) => setFolders(val || []));
    const unwatchSettings = bookmarksSettingsItem.watch((val) => setSettings(val));
    const unwatchSync = bookmarkSyncItem.watch((val) => setSyncState(val));

    return () => {
      mounted = false;
      unwatchBookmarks();
      unwatchFolders();
      unwatchSettings();
      unwatchSync();
    };
  }, []);

  const totalBookmarks = Object.keys(bookmarks).length;
  const isSyncing = syncState.status === 'syncing';
  const isErrorOrPaused = syncState.status === 'error' || syncState.status === 'paused';

  // Cadence slider update
  const handleIntervalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const clamped = Math.max(5, Math.min(50, isNaN(val) ? 20 : val));
    const updated: BookmarksSettings = {
      ...settings,
      resurfacingInterval: clamped,
    };
    setSettings(updated);
    await bookmarksSettingsItem.setValue(updated);
  };

  // Resurfacing master switch toggle
  const handleToggleResurfacing = async (checked: boolean) => {
    const updated: BookmarksSettings = {
      ...settings,
      resurfacingEnabled: checked,
    };
    setSettings(updated);
    await bookmarksSettingsItem.setValue(updated);
  };

  // Quick-save toggle
  const handleToggleAskFolder = async (checked: boolean) => {
    const updated: BookmarksSettings = {
      ...settings,
      askFolderOnSave: checked,
    };
    setSettings(updated);
    await bookmarksSettingsItem.setValue(updated);
  };

  // Folder eligibility toggle
  const handleToggleFolderEligibility = async (folderId: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          resurfaceEnabled: f.resurfaceEnabled === false ? true : false,
        };
      }
      return f;
    });
    setFolders(updatedFolders);
    await foldersItem.setValue(updatedFolders);
  };

  const handleStartRename = (folder: BookmarkFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setEditingFolderColor(folder.color || '#1D9BF0');
    setDeletingFolderId(null);
  };

  const handleSaveRename = async (folderId: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!editingFolderName.trim()) return;
    await renameFolder(folderId, editingFolderName, editingFolderColor);
    setEditingFolderId(null);
  };

  const handleConfirmDelete = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFolder(folderId);
    setDeletingFolderId(null);
  };

  const handleCreateFolder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    const newFolder: BookmarkFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      color: newFolderColor || '#1D9BF0',
      createdAt: Date.now(),
      resurfaceEnabled: true,
    };
    const currentFolders = await foldersItem.getValue();
    await foldersItem.setValue([...currentFolders, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  // Primary Sync Button action
  const handleSyncClick = async () => {
    if (isSyncing) return;
    setSyncState((prev) => ({
      ...prev,
      status: 'syncing',
      errorReason: null,
    }));
    await bookmarkSyncItem.setValue({
      ...syncState,
      status: 'syncing',
      errorReason: null,
    });

    try {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        let isAlreadyOnBookmarks = false;
        if (activeTab.url) {
          try {
            const urlObj = new URL(activeTab.url);
            isAlreadyOnBookmarks = isBookmarksRoute(urlObj.pathname);
          } catch {}
        }
        if (!isAlreadyOnBookmarks) {
          await browser.tabs.update(activeTab.id, { url: BOOKMARKS_URL });
          return;
        }
      }
    } catch {}

    if (isErrorOrPaused) {
      await resumeSync();
    } else {
      await syncBookmarksBackground();
    }
  };

  // Export JSON
  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      bookmarks,
      folders,
      sync: syncState,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `better-twitter-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let importedBookmarks: Record<string, BookmarkItem> = {};

      if (parsed.bookmarks && typeof parsed.bookmarks === 'object') {
        if (Array.isArray(parsed.bookmarks)) {
          for (const item of parsed.bookmarks) {
            if (item && item.id) {
              importedBookmarks[item.id] = item;
            }
          }
        } else {
          importedBookmarks = parsed.bookmarks;
        }
      }

      const importedCount = Object.keys(importedBookmarks).length;
      if (importedCount === 0) {
        setImportStatus('No valid bookmarks found in file.');
        return;
      }

      // Merge bookmarks
      const current = await bookmarksItem.getValue();
      const merged = { ...current, ...importedBookmarks };
      await bookmarksItem.setValue(merged);

      // Merge folders if present
      if (Array.isArray(parsed.folders)) {
        const currentFolders = await foldersItem.getValue();
        const existingIds = new Set(currentFolders.map((f) => f.id));
        const newFolders = parsed.folders.filter((f: any) => f && f.id && !existingIds.has(f.id));
        if (newFolders.length > 0) {
          await foldersItem.setValue([...currentFolders, ...newFolders]);
        }
      }

      setImportStatus(`Successfully imported ${importedCount} bookmarks!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch {
      setImportStatus('Failed to parse bookmarks file.');
      setTimeout(() => setImportStatus(null), 4000);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const percentUsed = Math.min(100, Math.round((storageUsage.bytesInUse / 10485760) * 100));
  const mbUsed = (storageUsage.bytesInUse / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-5 text-[var(--bt-fg,#e7e9ea)] pb-4 font-sans select-none">
      {/* 1. Header Stat & Sync Card */}
      <div className="p-4 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] space-y-3">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-[var(--bt-fg,#e7e9ea)] leading-tight">
            {totalBookmarks} Bookmark{totalBookmarks === 1 ? '' : 's'} Captured
          </h2>
          <p className="text-[13px] text-[var(--bt-fg-muted,#71767b)] mt-0.5">
            {syncState.lastSyncTime
              ? `Last synced ${formatRelativeTime(syncState.lastSyncTime)}`
              : 'Never synced'}
          </p>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSyncClick}
          className={`w-full h-10 px-4 rounded-full font-semibold text-[15px] flex items-center justify-center transition-opacity cursor-pointer ${
            isSyncing
              ? 'bg-[var(--bt-surface-elevated,#202327)] text-[var(--bt-fg-muted,#71767b)] cursor-not-allowed'
              : 'bg-[var(--bt-accent,#1d9bf0)] text-white hover:opacity-90 active:opacity-80'
          }`}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Syncing bookmarks: {totalBookmarks} captured...</span>
            </>
          ) : isErrorOrPaused ? (
            <span>Resume Sync</span>
          ) : (
            <span>Sync Bookmarks Now</span>
          )}
        </button>

        {/* Paused / Error Banner */}
        {isErrorOrPaused && (
          <div className="p-3 rounded-lg bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-warn,#ff9500)] text-[var(--bt-fg,#e7e9ea)] text-[13px] leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[var(--bt-warn,#ff9500)] shrink-0 mt-0.5" />
            <span>
              Bookmark Sync Paused: Unable to connect to X or session expired. Please verify you are logged into x.com and click 'Resume Sync'.
            </span>
          </div>
        )}
      </div>

      {/* 2. TIMELINE RESURFACING Section */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold tracking-wider text-[var(--bt-fg-muted,#71767b)] uppercase">
          Timeline Resurfacing
        </h3>

        <div className="p-3.5 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="toggle-resurfacing" className="text-[14px] font-medium text-[var(--bt-fg,#e7e9ea)] block">
                Resurface in Home timeline
              </label>
              <span className="text-[12px] text-[var(--bt-fg-muted,#71767b)]">
                Inject saved tweets periodically into /home
              </span>
            </div>
            <Switch
              id="toggle-resurfacing"
              checked={settings.resurfacingEnabled}
              onCheckedChange={handleToggleResurfacing}
            />
          </div>

          <div
            className={`space-y-2 pt-2 border-t border-[var(--bt-border,#2f3336)] ${
              settings.resurfacingEnabled ? '' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-[var(--bt-fg,#e7e9ea)]">
                Resurface interval: every {settings.resurfacingInterval} tweets
              </span>
            </div>

            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={settings.resurfacingInterval}
              onChange={handleIntervalChange}
              aria-label="Resurface interval in tweets"
              className="w-full accent-[var(--bt-accent,#1d9bf0)] cursor-pointer h-2 bg-[var(--bt-surface-elevated,#202327)] rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-[var(--bt-fg-muted,#71767b)] px-0.5">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOLDER ELIGIBILITY & CATEGORIES Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold tracking-wider text-[var(--bt-fg-muted,#71767b)] uppercase">
            Categories & Eligibility
          </h3>
          <button
            type="button"
            onClick={() => {
              setIsAddingFolder(true);
              setEditingFolderId(null);
              setDeletingFolderId(null);
            }}
            className="text-[12px] text-[var(--bt-accent,#1d9bf0)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New folder</span>
          </button>
        </div>

        {/* Inline Create Folder Form */}
        {isAddingFolder && (
          <form
            onSubmit={handleCreateFolder}
            className="p-3 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] space-y-2.5"
          >
            <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--bt-fg,#e7e9ea)]">
              <span>Create New Category</span>
              <button
                type="button"
                onClick={() => setIsAddingFolder(false)}
                className="text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Category name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              className="w-full h-8 px-2.5 text-[13px] rounded-md bg-[var(--bt-surface-elevated,#202327)] text-[var(--bt-fg,#e7e9ea)] placeholder:text-[var(--bt-fg-muted,#71767b)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {['#1D9BF0', '#00BA7C', '#FFD400', '#F91880', '#7856FF', '#FF7A00'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c }}
                  >
                    {newFolderColor === c && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingFolder(false)}
                  className="px-2.5 py-1 text-[12px] rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-3 py-1 text-[12px] rounded bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] font-semibold disabled:opacity-50 hover:opacity-90 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="p-2 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] space-y-1">
          {folders.map((folder) => {
            const isEligible = folder.resurfaceEnabled !== false;

            if (editingFolderId === folder.id) {
              return (
                <form
                  key={folder.id}
                  onSubmit={(e) => handleSaveRename(folder.id, e)}
                  className="p-2 rounded-lg bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-accent,#1d9bf0)]/50 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: editingFolderColor || folder.color || '#71767B' }}
                    />
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      autoFocus
                      className="flex-1 h-7 px-2 text-[13px] rounded bg-[var(--bt-bg,#000000)] text-[var(--bt-fg,#e7e9ea)] border border-[var(--bt-border,#2f3336)] focus:outline-none focus:border-[var(--bt-accent,#1d9bf0)]"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {['#1D9BF0', '#00BA7C', '#FFD400', '#F91880', '#7856FF', '#FF7A00'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditingFolderColor(c)}
                          className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: c }}
                        >
                          {editingFolderColor === c && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingFolderId(null)}
                        className="px-2 py-0.5 text-[11px] rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editingFolderName.trim()}
                        className="px-2.5 py-0.5 text-[11px] rounded bg-[var(--bt-accent,#1d9bf0)] text-[var(--bt-accent-fg,#ffffff)] font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            if (deletingFolderId === folder.id) {
              return (
                <div
                  key={folder.id}
                  className="p-2.5 rounded-lg bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-destructive,#f4212e)]/50 space-y-2 text-[12px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[var(--bt-fg,#e7e9ea)]">
                    Delete category <strong>"{folder.name}"</strong>? Bookmarks in this category will be moved to Uncategorized.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingFolderId(null)}
                      className="px-2 py-0.5 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleConfirmDelete(folder.id, e)}
                      className="px-2.5 py-0.5 rounded bg-[var(--bt-destructive,#f4212e)] text-white font-semibold hover:opacity-90 cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={folder.id}
                data-slot="folder-eligibility-item"
                onClick={() => handleToggleFolderEligibility(folder.id)}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bt-surface-elevated,#202327)] cursor-pointer transition-colors"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isEligible}
                  aria-label={`Toggle resurfacing for ${folder.name}`}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    isEligible
                      ? 'bg-[var(--bt-accent,#1d9bf0)] border-[var(--bt-accent,#1d9bf0)] text-white'
                      : 'border-[var(--bt-border,#2f3336)] bg-transparent'
                  }`}
                >
                  {isEligible && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color || '#71767B' }}
                />

                <span className="text-[14px] text-[var(--bt-fg,#e7e9ea)] truncate flex-1">
                  {folder.name}
                </span>

                {/* Actions for custom categories (Rename & Delete) */}
                {folder.id !== 'uncategorized' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title={`Rename ${folder.name}`}
                      aria-label={`Rename ${folder.name}`}
                      onClick={(e) => handleStartRename(folder, e)}
                      className="p-1 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-fg,#e7e9ea)] hover:bg-[rgba(255,255,255,0.12)] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={`Delete ${folder.name}`}
                      aria-label={`Delete ${folder.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingFolderId(folder.id);
                        setEditingFolderId(null);
                      }}
                      className="p-1 rounded text-[var(--bt-fg-muted,#71767b)] hover:text-[var(--bt-destructive,#f4212e)] hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SETTINGS Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold tracking-wider text-[var(--bt-fg-muted,#71767b)] uppercase">
          Settings
        </h3>

        <div className="p-3.5 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] flex items-center justify-between">
          <div>
            <label htmlFor="toggle-ask-folder" className="text-[14px] font-medium text-[var(--bt-fg,#e7e9ea)] block">
              Ask for folder when bookmarking
            </label>
            <span className="text-[12px] text-[var(--bt-fg-muted,#71767b)]">
              Display folder selection popover on save
            </span>
          </div>
          <Switch
            id="toggle-ask-folder"
            checked={settings.askFolderOnSave}
            onCheckedChange={handleToggleAskFolder}
          />
        </div>
      </div>

      {/* 5. STORAGE QUOTA Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold tracking-wider text-[var(--bt-fg-muted,#71767b)] uppercase">
          Storage Quota
        </h3>

        <div className="p-3.5 rounded-xl bg-[var(--bt-surface,#16181c)] border border-[var(--bt-border,#2f3336)] space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--bt-fg,#e7e9ea)]">
              {mbUsed} MB of 10 MB used ({percentUsed}%)
            </span>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={storageUsage.bytesInUse}
            aria-valuemin={0}
            aria-valuemax={10485760}
            aria-label="Storage quota usage"
            className="h-2 w-full bg-[var(--bt-surface-elevated,#202327)] rounded-full overflow-hidden"
          >
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                percentUsed >= 95
                  ? 'bg-[var(--bt-destructive,#f4212e)]'
                  : percentUsed >= 80
                  ? 'bg-[var(--bt-warn,#ff9500)]'
                  : 'bg-[var(--bt-accent,#1d9bf0)]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Amber Warning Banner visible if >= 80% */}
          {percentUsed >= 80 && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-warn,#ff9500)] text-[var(--bt-fg,#e7e9ea)] text-[12px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--bt-warn,#ff9500)] shrink-0 mt-0.5" />
              <span>
                Storage 80% Full: Older uncategorized bookmarks will be auto-pruned if storage fills completely. Custom folders are protected.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 6. BACKUP & RESTORE Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold tracking-wider text-[var(--bt-fg-muted,#71767b)] uppercase">
          Backup & Restore
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="h-10 px-3 rounded-xl bg-[var(--bt-surface,#16181c)] hover:bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-border,#2f3336)] text-[13px] font-medium text-[var(--bt-fg,#e7e9ea)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4 text-[var(--bt-fg-muted,#71767b)]" />
            <span>Export Bookmarks (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="h-10 px-3 rounded-xl bg-[var(--bt-surface,#16181c)] hover:bg-[var(--bt-surface-elevated,#202327)] border border-[var(--bt-border,#2f3336)] text-[13px] font-medium text-[var(--bt-fg,#e7e9ea)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4 text-[var(--bt-fg-muted,#71767b)]" />
            <span>Import Bookmarks (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {importStatus && (
          <p className="text-[12px] text-center text-[var(--bt-accent,#1d9bf0)] pt-1">
            {importStatus}
          </p>
        )}
      </div>
    </div>
  );
}

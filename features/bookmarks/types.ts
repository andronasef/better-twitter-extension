export interface BookmarkItem {
  id: string;
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  createdAt: number;
  savedAt: number;
  mediaUrls?: string[];
  folderIds: string[];
  tags: string[];
  resurfaceCount: number;
  lastResurfacedAt?: number;
  snoozedUntil?: number;
  neverResurface?: boolean;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  isDefault?: boolean;
  resurfaceEnabled: boolean;
}

export interface BookmarkSyncState {
  status: 'idle' | 'syncing' | 'paused' | 'error' | 'complete';
  cursor: string | null;
  totalCaptured: number;
  lastSyncTime: number | null;
  lastCheckpointTime: number | null;
  errorReason: 'not_logged_in' | 'rate_limited' | 'endpoint_changed' | 'network_error' | null;
  lastPrunedCount?: number;
  lastPrunedAt?: number;
}

export interface BookmarksSettings {
  resurfacingEnabled: boolean;
  resurfacingInterval: number;
  askFolderOnSave: boolean;
}

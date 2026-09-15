import React, { useState, useEffect } from 'react';
import {
  engagementItem,
  diagnosticsItem,
  bookmarksItem,
  foldersItem,
  settingsItem,
  type EngagementState,
  type Diagnostics,
} from '@/lib/storage';
import { isEligibleForPrompt, SEVEN_DAYS_MS } from '@/features/engagement';
import { openWelcomePage, openUpdatePage } from '@/lib/lifecycle';
import {
  Sparkles,
  Zap,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Bookmark,
  ExternalLink,
  Trash2,
  HardDrive,
  Check,
} from 'lucide-react';

export function DevToolsPanel() {
  const [engagement, setEngagement] = useState<EngagementState | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({});
  const [message, setMessage] = useState<string | null>(null);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);

  const showFeedback = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const refreshState = async () => {
    try {
      const eng = await engagementItem.getValue();
      setEngagement(eng);
      const diag = await diagnosticsItem.getValue();
      setDiagnostics(diag || {});
      const bmarks = await bookmarksItem.getValue();
      setBookmarkCount(Object.keys(bmarks || {}).length);

      if (typeof browser !== 'undefined' && browser.storage?.local?.getBytesInUse) {
        browser.storage.local.getBytesInUse(null).then((bytes) => {
          setStorageBytes(bytes);
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshState();
    const unwatchEng = engagementItem.watch((val) => setEngagement(val));
    const unwatchDiag = diagnosticsItem.watch((val) => setDiagnostics(val || {}));
    return () => {
      unwatchEng();
      unwatchDiag();
    };
  }, []);

  // Engagement action handlers
  const handleForceTrigger = async () => {
    const curr = (await engagementItem.getValue()) || {
      installedAt: Date.now(),
      lastShownAt: null,
      actionTaken: null,
      dismissCount: 0,
      snoozedUntil: null,
      devForceTrigger: 0,
    };
    await engagementItem.setValue({
      ...curr,
      devForceTrigger: (curr.devForceTrigger || 0) + 1,
    });
    showFeedback('⚡ Triggered prompt on active tab!');
  };

  const handleSimulate8Days = async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const curr = (await engagementItem.getValue()) || {};
    await engagementItem.setValue({
      ...curr,
      installedAt: eightDaysAgo,
      actionTaken: null,
      dismissCount: 0,
      snoozedUntil: null,
    });
    showFeedback('Simulated 8 days installed (Eligible!)');
    refreshState();
  };

  const handleSimulateFreshInstall = async () => {
    await engagementItem.setValue({
      installedAt: Date.now(),
      lastShownAt: null,
      actionTaken: null,
      dismissCount: 0,
      snoozedUntil: null,
      devForceTrigger: 0,
    });
    showFeedback('Reset to fresh install (0 days)');
    refreshState();
  };

  const handleResetEngagement = async () => {
    await engagementItem.setValue({
      installedAt: Date.now(),
      lastShownAt: null,
      actionTaken: null,
      dismissCount: 0,
      snoozedUntil: null,
      devForceTrigger: 0,
    });
    showFeedback('Cleared engagement state');
    refreshState();
  };

  // Diagnostics handlers
  const handleTriggerDiagnostics = async () => {
    await diagnosticsItem.setValue({
      mockMiss: {
        selector: 'div[data-testid="mock-missing-element"]',
        firstSeen: Date.now(),
      },
    });
    if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
      browser.runtime.sendMessage({
        type: 'bt:diagnostics-transition',
        hasMisses: true,
      }).catch(() => {});
    }
    showFeedback('Simulated broken selector & orange badge');
  };

  const handleClearDiagnostics = async () => {
    await diagnosticsItem.setValue({});
    if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
      browser.runtime.sendMessage({
        type: 'bt:diagnostics-transition',
        hasMisses: false,
      }).catch(() => {});
    }
    showFeedback('Cleared diagnostics & badge');
  };

  // Bookmarks handlers
  const handleSeedBookmarks = async () => {
    const sampleBookmarks = {
      tweet_1: {
        id: 'tweet_1',
        tweetUrl: 'https://x.com/bettertwitter/status/1001',
        authorName: 'Better Twitter',
        authorHandle: 'bettertwitter',
        text: 'Better Twitter gives you reactions, ad stripping, and distraction-free timelines!',
        folderId: 'uncategorized',
        savedAt: Date.now() - 3600000,
        resurfaceCount: 0,
        neverResurface: false,
      },
      tweet_2: {
        id: 'tweet_2',
        tweetUrl: 'https://x.com/reactjs/status/1002',
        authorName: 'React',
        authorHandle: 'reactjs',
        text: 'React 19 is now stable! Explore Server Actions and Actions hooks.',
        folderId: 'uncategorized',
        savedAt: Date.now() - 7200000,
        resurfaceCount: 0,
        neverResurface: false,
      },
      tweet_3: {
        id: 'tweet_3',
        tweetUrl: 'https://x.com/vitejs/status/1003',
        authorName: 'Vite',
        authorHandle: 'vitejs',
        text: 'Lightning fast frontend tooling for modern web applications.',
        folderId: 'uncategorized',
        savedAt: Date.now() - 10800000,
        resurfaceCount: 0,
        neverResurface: false,
      },
    };
    await bookmarksItem.setValue(sampleBookmarks as any);
    showFeedback('Seeded 3 sample bookmarks');
    refreshState();
  };

  const handleClearBookmarks = async () => {
    await bookmarksItem.setValue({});
    showFeedback('Cleared all bookmarks');
    refreshState();
  };

  const handleResetSettings = async () => {
    await settingsItem.setValue({
      version: 4,
      features: {
        hidePromotedTweets: true,
        cleanSidebar: false,
        hideVanityMetrics: false,
        hideProfileCounts: false,
        swapHomeTabs: false,
        hideForYouTab: false,
        hideFloatingDrawers: false,
      },
      theme: 'default',
      customAccent: null,
    });
    showFeedback('Reset settings to defaults');
  };

  // Calculations for UI display
  const daysInstalled = engagement?.installedAt
    ? ((Date.now() - engagement.installedAt) / (24 * 3600 * 1000)).toFixed(1)
    : '0';
  const eligible = isEligibleForPrompt(engagement);

  return (
    <div className="view-enter-panel flex flex-col gap-4 text-[13px]">
      {/* Dev notification toast */}
      {message && (
        <div className="flex items-center gap-2 p-2 bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30 rounded-lg text-[12px] font-medium animate-in fade-in">
          <Check className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* SECTION 1: Rate & Share Prompt Testing */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--bt-surface)] border border-[var(--bt-border)] rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[var(--bt-fg)]">
            <Sparkles className="h-4 w-4 text-[#FFD700]" />
            <span>Rate & Share Prompt</span>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              eligible
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-[var(--bt-border)] text-[var(--bt-fg-muted)]'
            }`}
          >
            {eligible ? 'Eligible' : 'Not Eligible'}
          </span>
        </div>

        {/* Live status readout */}
        <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--bt-fg-muted)] bg-[var(--bt-bg)] p-2 rounded-lg border border-[var(--bt-border)]">
          <div>
            Age: <span className="text-[var(--bt-fg)] font-medium">{daysInstalled} days</span>
          </div>
          <div>
            Action: <span className="text-[var(--bt-fg)] font-medium">{engagement?.actionTaken || 'None'}</span>
          </div>
          <div>
            Dismissed: <span className="text-[var(--bt-fg)] font-medium">{engagement?.dismissCount || 0} / 3</span>
          </div>
          <div>
            Snoozed: <span className="text-[var(--bt-fg)] font-medium">{engagement?.snoozedUntil && engagement.snoozedUntil > Date.now() ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 mt-1">
          <button
            type="button"
            onClick={handleForceTrigger}
            className="w-full h-8 px-3 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[12px]"
          >
            <Zap className="h-3.5 w-3.5" />
            Force Show Prompt on Active Tab
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleSimulate8Days}
              className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
            >
              <Calendar className="h-3 w-3 text-[#1D9BF0]" />
              Set 8 Days Old
            </button>
            <button
              type="button"
              onClick={handleSimulateFreshInstall}
              className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3 text-[var(--bt-fg-muted)]" />
              Set 0 Days Old
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetEngagement}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg-muted)] hover:text-[var(--bt-destructive)] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Engagement State
          </button>
        </div>
      </div>

      {/* SECTION 2: Diagnostics & Badge */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--bt-surface)] border border-[var(--bt-border)] rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[var(--bt-fg)]">
            <AlertTriangle className="h-4 w-4 text-[var(--bt-warn)]" />
            <span>Diagnostics & Badge</span>
          </div>
          <span className="text-[10px] text-[var(--bt-fg-muted)]">
            {Object.keys(diagnostics).length} active misses
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleTriggerDiagnostics}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-warn)] transition-colors cursor-pointer"
          >
            Simulate Broken Selector
          </button>
          <button
            type="button"
            onClick={handleClearDiagnostics}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
          >
            Clear Diagnostics
          </button>
        </div>
      </div>

      {/* SECTION 3: Bookmarks & Storage */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--bt-surface)] border border-[var(--bt-border)] rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[var(--bt-fg)]">
            <Bookmark className="h-4 w-4 text-[#1D9BF0]" />
            <span>Bookmarks & Storage</span>
          </div>
          <span className="text-[10px] text-[var(--bt-fg-muted)]">
            {bookmarkCount} bookmarks
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleSeedBookmarks}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
          >
            Seed 3 Bookmarks
          </button>
          <button
            type="button"
            onClick={handleClearBookmarks}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-destructive)] transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Clear Bookmarks
          </button>
        </div>

        {storageBytes !== null && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--bt-fg-muted)] mt-0.5">
            <HardDrive className="h-3 w-3" />
            <span>Storage size: {(storageBytes / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </div>

      {/* SECTION 4: Lifecycle & Reset */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--bt-surface)] border border-[var(--bt-border)] rounded-xl">
        <span className="font-bold text-[var(--bt-fg)]">Lifecycle Pages & Defaults</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => openWelcomePage()}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            Welcome Guide
          </button>
          <button
            type="button"
            onClick={() => openUpdatePage()}
            className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg)] transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            Update Page
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetSettings}
          className="h-7 px-2 border border-[var(--bt-border)] hover:bg-[var(--bt-bg)] rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--bt-fg-muted)] hover:text-[var(--bt-destructive)] transition-colors cursor-pointer mt-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All Settings to Defaults
        </button>
      </div>
    </div>
  );
}

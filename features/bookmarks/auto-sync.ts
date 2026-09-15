import { bookmarkAutoSyncItem, bookmarkSyncItem } from '@/lib/storage';
import { isBookmarksRoute } from './routes';

export const AUTOSYNC_ALARM_NAME = 'bt:bookmark-autosync';
/** 7 days, in minutes. */
export const AUTOSYNC_PERIOD_MINUTES = 7 * 24 * 60;

/**
 * Registers the periodic alarm, preserving any pending countdown.
 *
 * Deliberately get-then-create: the background calls this on every browser
 * startup, and an unconditional create would reset the 7-day countdown each
 * time, so a user who restarts Chrome daily would never see it fire.
 */
export async function ensureAutoSyncAlarm(): Promise<void> {
  try {
    const existing = await browser.alarms.get(AUTOSYNC_ALARM_NAME);
    if (existing) return;
    browser.alarms.create(AUTOSYNC_ALARM_NAME, {
      periodInMinutes: AUTOSYNC_PERIOD_MINUTES,
    });
  } catch {
    // A missing alarms API must never take down background startup.
  }
}

export async function handleAutoSyncAlarm(alarm: { name?: string } | undefined): Promise<void> {
  if (!alarm || alarm.name !== AUTOSYNC_ALARM_NAME) return;
  try {
    await markAutoSyncDue();
  } catch {
    // Ignore — the next alarm will try again.
  }
}

/**
 * Records that a sync has become due. Does not restamp an existing due time —
 * the value means "when it first became due".
 */
export async function markAutoSyncDue(now: number = Date.now()): Promise<boolean> {
  const record = await bookmarkAutoSyncItem.getValue();
  if (!record.enabled) return false;
  if (record.dueSince !== null) return false;

  await bookmarkAutoSyncItem.setValue({ ...record, dueSince: now });
  return true;
}

/** Clears the due flag once a sync has actually started (auto or manual). */
export async function markAutoSyncSatisfied(now: number = Date.now()): Promise<void> {
  const record = await bookmarkAutoSyncItem.getValue();
  await bookmarkAutoSyncItem.setValue({
    ...record,
    dueSince: null,
    lastAutoSyncAt: now,
  });
}

// Page-session scoped: the content script's module lifetime is exactly the
// "once per page session" window we want.
let sessionTriggered = false;

/** Test-only seam for resetting the once-per-session guard. */
export function __resetAutoSyncSessionGuard(): void {
  sessionTriggered = false;
}

/**
 * Starts a due sync when the user lands on the bookmarks page. Sync needs the
 * page's own GraphQL request template, so this is the only place it can run.
 */
export async function runOpportunisticAutoSync(opts: {
  pathname: string;
  trigger: () => void | Promise<void>;
  now?: number;
}): Promise<boolean> {
  // Cheap synchronous rejections first — these are the common case.
  if (!isBookmarksRoute(opts.pathname)) return false;
  if (sessionTriggered) return false;

  const record = await bookmarkAutoSyncItem.getValue();
  if (!record.enabled) return false;
  if (record.dueSince === null) return false;

  const syncState = await bookmarkSyncItem.getValue();
  if (syncState.status === 'syncing') return false;

  // Set before awaiting so a same-tick caller cannot slip through.
  sessionTriggered = true;
  try {
    await opts.trigger();
    await markAutoSyncSatisfied(opts.now);
    return true;
  } catch {
    // Leave the sync due so a later visit retries it.
    sessionTriggered = false;
    return false;
  }
}

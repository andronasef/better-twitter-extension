import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { bookmarkAutoSyncItem, bookmarkSyncItem } from '@/lib/storage';
import {
  AUTOSYNC_ALARM_NAME,
  AUTOSYNC_PERIOD_MINUTES,
  ensureAutoSyncAlarm,
  handleAutoSyncAlarm,
  markAutoSyncDue,
  markAutoSyncSatisfied,
  runOpportunisticAutoSync,
  __resetAutoSyncSessionGuard,
} from '@/features/bookmarks/auto-sync';

const idleSync = {
  status: 'idle' as const,
  cursor: null,
  totalCaptured: 0,
  lastSyncTime: null,
  lastCheckpointTime: null,
  errorReason: null,
};

describe('Bookmark auto-sync due state (BOOK-02)', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    __resetAutoSyncSessionGuard();
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: null,
    });
    await bookmarkSyncItem.setValue(idleSync);
  });

  it('stamps dueSince when the alarm marks a sync due', async () => {
    expect(await markAutoSyncDue(1000)).toBe(true);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);
  });

  it('does nothing when auto-sync is disabled', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: false,
      lastAutoSyncAt: null,
      dueSince: null,
    });
    expect(await markAutoSyncDue(1000)).toBe(false);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBeNull();
  });

  it('keeps the original dueSince rather than restamping it', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    expect(await markAutoSyncDue(2000)).toBe(false);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);
  });

  it('marks due from a real alarm event', async () => {
    fakeBrowser.alarms.onAlarm.addListener(handleAutoSyncAlarm);
    await fakeBrowser.alarms.onAlarm.trigger({
      name: AUTOSYNC_ALARM_NAME,
      scheduledTime: Date.now(),
    } as any);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).not.toBeNull();
  });

  it('ignores alarms belonging to other features', async () => {
    fakeBrowser.alarms.onAlarm.addListener(handleAutoSyncAlarm);
    await fakeBrowser.alarms.onAlarm.trigger({
      name: 'something-else',
      scheduledTime: Date.now(),
    } as any);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBeNull();
  });

  it('registers the alarm once and preserves a pending schedule', async () => {
    await ensureAutoSyncAlarm();
    const alarm = await fakeBrowser.alarms.get(AUTOSYNC_ALARM_NAME);
    expect(alarm).toBeTruthy();
    expect(alarm!.periodInMinutes).toBe(AUTOSYNC_PERIOD_MINUTES);

    const createSpy = vi.spyOn(fakeBrowser.alarms, 'create');
    await ensureAutoSyncAlarm();
    expect(createSpy).not.toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it('runs the sync when due on the bookmarks page', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    const trigger = vi.fn();

    const ran = await runOpportunisticAutoSync({
      pathname: '/i/bookmarks',
      trigger,
    });

    expect(ran).toBe(true);
    expect(trigger).toHaveBeenCalledTimes(1);
    const record = await bookmarkAutoSyncItem.getValue();
    expect(record.dueSince).toBeNull();
    expect(record.lastAutoSyncAt).not.toBeNull();
  });

  it('does not run when no sync is due', async () => {
    const trigger = vi.fn();
    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(false);
    expect(trigger).not.toHaveBeenCalled();
  });

  it('does not run when auto-sync is disabled', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: false,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    const trigger = vi.fn();
    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(false);
    expect(trigger).not.toHaveBeenCalled();
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);
  });

  it('does not run away from the bookmarks route', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    const trigger = vi.fn();
    expect(await runOpportunisticAutoSync({ pathname: '/home', trigger })).toBe(false);
    expect(trigger).not.toHaveBeenCalled();
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);
  });

  it('does not run while a sync is already in flight', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    await bookmarkSyncItem.setValue({ ...idleSync, status: 'syncing' });
    const trigger = vi.fn();
    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(false);
    expect(trigger).not.toHaveBeenCalled();
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);
  });

  it('runs at most once per page session', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    const trigger = vi.fn();

    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(true);

    // Re-arm the due flag so only the session guard can block the second run.
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 2000,
    });
    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(false);
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('leaves the sync due when the trigger throws', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    const trigger = vi.fn(() => {
      throw new Error('bridge unavailable');
    });

    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger })).toBe(false);
    expect((await bookmarkAutoSyncItem.getValue()).dueSince).toBe(1000);

    // The session guard was released, so a later attempt can still run.
    const ok = vi.fn();
    expect(await runOpportunisticAutoSync({ pathname: '/i/bookmarks', trigger: ok })).toBe(true);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('clears the due flag when a sync is satisfied manually', async () => {
    await bookmarkAutoSyncItem.setValue({
      enabled: true,
      lastAutoSyncAt: null,
      dueSince: 1000,
    });
    await markAutoSyncSatisfied(5000);
    const record = await bookmarkAutoSyncItem.getValue();
    expect(record.dueSince).toBeNull();
    expect(record.lastAutoSyncAt).toBe(5000);
  });
});

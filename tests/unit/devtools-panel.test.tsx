(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DevToolsPanel } from '@/entrypoints/popup/DevToolsPanel';
import { engagementItem, diagnosticsItem, bookmarksItem } from '@/lib/storage';

describe('DevToolsPanel Component', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Reset storage items
    await engagementItem.setValue({
      installedAt: Date.now(),
      lastShownAt: null,
      actionTaken: null,
      dismissCount: 0,
      snoozedUntil: null,
      devForceTrigger: 0,
    });
    await diagnosticsItem.setValue({});
    await bookmarksItem.setValue({});
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
  });

  it('renders all 4 sections and displays current engagement state', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<DevToolsPanel />);
    });

    expect(container.textContent).toContain('Rate & Share Prompt');
    expect(container.textContent).toContain('Diagnostics & Badge');
    expect(container.textContent).toContain('Bookmarks & Storage');
    expect(container.textContent).toContain('Lifecycle Pages & Defaults');
  });

  it('updates engagement item with devForceTrigger on force show click', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<DevToolsPanel />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const forceBtn = buttons.find((b) => b.textContent?.includes('Force Show Prompt'));
    expect(forceBtn).toBeDefined();

    await act(async () => {
      forceBtn?.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    const updated = await engagementItem.getValue();
    expect(updated.devForceTrigger).toBeGreaterThan(0);
  });

  it('sets installedAt to 8 days ago when Set 8 Days Old is clicked', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<DevToolsPanel />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const eightDaysBtn = buttons.find((b) => b.textContent?.includes('Set 8 Days Old'));
    expect(eightDaysBtn).toBeDefined();

    await act(async () => {
      eightDaysBtn?.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    const updated = await engagementItem.getValue();
    const diffDays = (Date.now() - updated.installedAt) / (24 * 3600 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(7.9);
  });

  it('simulates broken selector diagnostics miss when clicked', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<DevToolsPanel />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const brokenBtn = buttons.find((b) => b.textContent?.includes('Simulate Broken Selector'));
    expect(brokenBtn).toBeDefined();

    await act(async () => {
      brokenBtn?.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    const diag = await diagnosticsItem.getValue();
    expect(Object.keys(diag).length).toBeGreaterThan(0);
    expect(diag.mockMiss).toBeDefined();
  });

  it('seeds sample bookmarks into storage when clicked', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<DevToolsPanel />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const seedBtn = buttons.find((b) => b.textContent?.includes('Seed 3 Bookmarks'));
    expect(seedBtn).toBeDefined();

    await act(async () => {
      seedBtn?.click();
      await new Promise((r) => setTimeout(r, 20));
    });

    const bmarks = await bookmarksItem.getValue();
    expect(Object.keys(bmarks).length).toBe(3);
  });
});

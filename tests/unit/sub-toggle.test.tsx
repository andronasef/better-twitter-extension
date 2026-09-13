(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubToggleRow } from '@/entrypoints/popup/SubToggleRow';
import { CategoryPanel } from '@/entrypoints/popup/CategoryPanel';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { FeatureEntry, CategoryEntry } from '@/lib/registry';
import { Columns3 } from 'lucide-react';

describe('SubToggleRow & CategoryPanel sub-toggles (UI-SPEC, D-01, D-03, D-08)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const parentFeature: FeatureEntry = {
    id: 'hideVanityMetrics',
    categoryId: 'timeline',
    title: 'Hide vanity metrics',
    tooltip: 'Removes like, repost, and reply numbers from tweets while keeping action buttons interactive.',
    defaultEnabled: false,
  };

  const subFeature: FeatureEntry = {
    id: 'hideProfileCounts',
    categoryId: 'timeline',
    parentId: 'hideVanityMetrics',
    title: 'Hide profile follower counts',
    tooltip: 'Hides follower and following counts on user profile pages.',
    defaultEnabled: false,
  };

  const category: CategoryEntry = {
    id: 'timeline',
    caption: 'Timeline',
    icon: Columns3,
  };

  it('renders SubToggleRow with 28px indent (pl-7) and connector line', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TooltipProvider>
          <SubToggleRow
            feature={subFeature}
            parentFeature={parentFeature}
            parentEnabled={true}
            checked={false}
            disabled={false}
            hasDiagnosticMiss={false}
            onToggle={vi.fn()}
          />
        </TooltipProvider>
      );
    });

    const row = container.firstElementChild as HTMLElement;
    expect(row.className).toContain('pl-7');
    expect(row.className).toContain('min-h-[40px]');

    const connector = row.querySelector('[aria-hidden="true"]');
    expect(connector).not.toBeNull();
    expect(connector?.className).toContain('left-[14px]');
  });

  it('dims the sub-toggle row and disables switch when parent toggle is OFF', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TooltipProvider>
          <SubToggleRow
            feature={subFeature}
            parentFeature={parentFeature}
            parentEnabled={false}
            checked={true}
            disabled={false}
            hasDiagnosticMiss={false}
            onToggle={vi.fn()}
          />
        </TooltipProvider>
      );
    });

    const row = container.firstElementChild as HTMLElement;
    expect(row.className).toContain('opacity-50');

    const switchBtn = row.querySelector('button[role="switch"]');
    expect(switchBtn?.hasAttribute('disabled')).toBe(true);
  });

  it('CategoryPanel renders top-level toggles and groups sub-toggles under parent', async () => {
    const root = createRoot(container);
    const onToggle = vi.fn();

    await act(async () => {
      root.render(
        <TooltipProvider>
          <CategoryPanel
            category={category}
            features={[parentFeature, subFeature]}
            settings={{
              version: 2,
              features: {
                hideVanityMetrics: true,
                hideProfileCounts: false,
              },
            }}
            diagnostics={{}}
            onToggle={onToggle}
          />
        </TooltipProvider>
      );
    });

    const parentLabel = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'Hide vanity metrics'
    );
    expect(parentLabel).toBeDefined();

    const subLabel = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'Hide profile follower counts'
    );
    expect(subLabel).toBeDefined();
  });
});
